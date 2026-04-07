import contextlib
import re
from copy import deepcopy
from pathlib import Path
import ast

import torch
import torch.nn as nn
import torchvision

from ultralytics.nn.modules import *  # Import all modules
from ultralytics.nn.modules import __all__ as modules_all
from ultralytics.utils import LOGGER, colorstr
from ultralytics.utils.ops import make_divisible
from ultralytics.utils.plotting import feature_visualization

# Custom Imports
from custom_modules import BiFusionSE, Index, TorchVision, Permute

# Add BiFusionSE to frozensets if needed, or handle in elif
# We will redefine parse_model

def parse_model(d, ch, verbose=True):
    """Parse a YOLO model.yaml dictionary into a PyTorch model."""
    
    # Args
    legacy = True  # backward compatibility for v3/v5/v8/v9 models
    max_channels = float("inf")
    nc, act, scales = (d.get(x) for x in ("nc", "activation", "scales"))
    depth, width, kpt_shape = (d.get(x, 1.0) for x in ("depth_multiple", "width_multiple", "kpt_shape"))
    scale = d.get("scale")
    if scales:
        if not scale:
            scale = next(iter(scales.keys()))
            LOGGER.warning(f"no model scale passed. Assuming scale='{scale}'.")
        depth, width, max_channels = scales[scale]

    if act:
        Conv.default_act = eval(act)  # redefine default activation, i.e. Conv.default_act = torch.nn.SiLU()
        if verbose:
            LOGGER.info(f"{colorstr('activation:')} {act}")  # print

    if verbose:
        LOGGER.info(f"\n{'':>3}{'from':>20}{'n':>3}{'params':>10}  {'module':<45}{'arguments':<30}")
    ch = [ch]
    layers, save, c2 = [], [], ch[-1]  # layers, savelist, ch out
    
    # Define base modules (copied from tasks.py source logic or just import modules)
    # Since we imported *, we have them. 
    # But we need the set to check generic handling.
    # We'll just check explicitly for BiFusionSE.

    for i, (f, n, m, args) in enumerate(d["backbone"] + d["head"]):  # from, number, module, args
        m = (
            getattr(torch.nn, m[3:])
            if "nn." in m
            else getattr(torchvision.ops, m[16:])
            if "torchvision.ops." in m
            else globals()[m]
        )  # get module
        for j, a in enumerate(args):
            if isinstance(a, str):
                with contextlib.suppress(ValueError):
                    args[j] = locals()[a] if a in locals() else ast.literal_eval(a)
        n = n_ = max(round(n * depth), 1) if n > 1 else n  # depth gain
        
        # --- Custom Logic for BiFusionSE ---
        if m is BiFusionSE:
            c1 = [ch[x] for x in f] # Pass LIST of input channels
            c2 = args[0]
            if c2 != nc:
                c2 = make_divisible(min(c2, max_channels) * width, 8)
            
            # BiFusionSE init(c1, c2, reduction=4)
            # args from yaml: [c_out]
            args = [c1, c2, *args[1:]] 
            # Note: generic parse_model might prepend c1 if in base_modules. BiFusionSE is custom.
            # Our custom_modules.BiFusionSE expects c1 (list), c2.
            
        elif m in {TorchVision, Index}:
             # Custom modules we fixed to strip C2
             # But parse_model usually calculates c2.
             c2 = args[0]
             # c1 = ch[f] # We don't need c1 for these based on our new implementations
             # Just Strip c2 from args passed to module?
             # Wait, generic parse_model (else) passes ALL args.
             # If we handle them here:
             args = [*args[1:]] # Strip c2
             
        elif m is Concat:
            c2 = sum(ch[x] for x in f)
        elif m in {Detect, WorldDetect, YOLOEDetect, Segment, YOLOESegment, Pose, OBB, ImagePoolingAttn, v10Detect}:
            # Handle Detect arguments mismatch for Ultralytics 8.x
            # Detect signature: (nc, reg_max=16, end2end=False, ch=())
            # YAML provides: [nc] usually.
            if m is Detect:
                # If only nc provided, insert defaults
                if len(args) == 1:
                    args.extend([16, False]) # reg_max, end2end
                elif len(args) == 2:
                    args.append(False) # end2end
            
            args.append([ch[x] for x in f])
            if m is Segment or m is YOLOESegment:
                args[2] = make_divisible(min(args[2], max_channels) * width, 8)
            if m in {Detect, YOLOEDetect, Segment, YOLOESegment, Pose, OBB}:
                m.legacy = legacy
        elif m is RTDETRDecoder: # special case, channels arg must be passed in index 1
            args.insert(1, [ch[x] for x in f])
        elif m is CBLinear:
            c2 = args[0]
            c1 = ch[f]
            args = [c1, c2, *args[1:]]
        elif m is CBFuse:
            c2 = ch[f[-1]]
            
        # ... Other standard cases ...
        # Simplified: Use generic fallback for most, but handle c2 calc.
        else:
             # Generic handling
             # Determine c2
             if hasattr(m, 'c2'): # If module has c2 logic? No.
                 pass
             
             # Attempt to guess c2?
             # Standard logic:
             try:
                 c2 = ch[f]
             except TypeError:
                 # This happens if f is list (BiFusionSE handled above).
                 pass
                 
             if m in {Conv, GhostConv, Bottleneck, GhostBottleneck, SPP, SPPF, DWConv, Focus, BottleneckCSP, C1, C2, C2f, C3k2, RepNCSPELAN4, ELAN1, ADown, AConv, SPPELAN, C2fAttn, C3, C3TR, C3Ghost, C3x, RepC3, PSA, SCDown, C2fCIB, A2C2f}:
                c1, c2 = ch[f], args[0]
                if c2 != nc:  # if c2 not equal to number of classes (i.e. for Classify() output)
                    c2 = make_divisible(min(c2, max_channels) * width, 8)
                if m is C2fAttn:
                    args[1] = make_divisible(min(args[1], max_channels // 2) * width, 8)
                    args[2] = int(max(round(min(args[2], max_channels // 2 // 32)) * width, 1) if args[2] > 1 else args[2])
                args = [c1, c2, *args[1:]]
                if m in {BottleneckCSP, C1, C2, C2f, C3k2, C2fAttn, C3, C3TR, C3Ghost, C3x, RepC3, C2fPSA, C2fCIB, C2PSA, A2C2f}:
                    args.insert(2, n)  # number of repeats
                    n = 1

        # Instantiate
        m_ = torch.nn.Sequential(*(m(*args) for _ in range(n))) if n > 1 else m(*args)  # module
        t = str(m)[8:-2].replace("__main__.", "")  # module type
        m_.np = sum(x.numel() for x in m_.parameters())  # number params
        m_.i, m_.f, m_.type = i, f, t  # attach index, 'from' index, type
        if verbose:
            LOGGER.info(f"{i:>3}{f!s:>20}{n_:>3}{m_.np:10.0f}  {t:<45}{args!s:<30}")  # print
        save.extend(x % i for x in ([f] if isinstance(f, int) else f) if x != -1)  # append to savelist
        layers.append(m_)
        if i == 0:
            ch = []
        ch.append(c2)
    return torch.nn.Sequential(*layers), sorted(save)
