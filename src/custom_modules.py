import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision

from ultralytics.nn.modules.conv import Conv

class Index(nn.Module):
    """
    Selects a specific feature from a list of features.
    Args:
        c1: Input channels (unused, passed by generic parse_model)
        c2: Output channels (used for generic parse_model tracking)
        index: The index of the feature to select
    """
    def __init__(self, index):
        super().__init__()
        self.index = index
        self.c2 = 0

    def forward(self, x):
        # x is a list of tensors from the backbone
        if isinstance(x, (list, tuple)):
            return x[self.index]
        return x

class BiFusionSE(nn.Module):
    """
    BiFusionSE: (Lightweight & Robust Version)
    Bidirectional fusion + squeeze-excitation for dual-stream features.
    
    Adapted for standard Ultralytics parse_model:
    init(c1, c2, reduction=4) where:
      c1: list of input channels [ch_stream1, ch_stream2]
      c2: output channels (c_out)
    """

    def __init__(self, c1, c2, reduction=4):
        super().__init__()
        # Unpack input channels from list
        if isinstance(c1, (list, tuple)):
            c_src1, c_src2 = c1
        else:
            # Fallback if something weird happens, though standard parse_model passes list for multiple inputs
            raise ValueError(f"BiFusionSE expects c1 to be a list of 2 input channels, got {c1}")
            
        c_out = c2
        
        # 1x1 projections to get to half the output channels
        self.proj_c = Conv(c_src1, c_out // 2, 1, 1)
        self.proj_t = Conv(c_src2, c_out // 2, 1, 1)

        # Squeeze-Excitation block (operates on concatenated c_out)
        se_hidden = max(c_out // reduction, 8)
        self.se = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(c_out, se_hidden, 1, 1, 0),
            nn.SiLU(inplace=True),
            nn.Conv2d(se_hidden, c_out, 1, 1, 0),
            nn.Sigmoid(),
        )

        # Lightweight 3x3 Depthwise-Separable Conv for local mixing
        self.fuse = nn.Sequential(
            Conv(c_out, c_out, 3, 1, g=c_out),  # 3x3 Depthwise
            Conv(c_out, c_out, 1, 1),          # 1x1 Pointwise
        )

    def forward(self, x):
        # x is a list/tuple: [x_c, x_t]
        x_c, x_t = x
        
        # Apply 1x1 projections
        xc = self.proj_c(x_c)
        xt = self.proj_t(x_t)

        # 1. Concatenate streams
        z = torch.cat([xc, xt], dim=1)

        # 2. Apply SE to learn channel-fusion weights
        w = self.se(z)
        
        # 3. Apply fusion weights (gating + residual)
        z_fused = z * w + z

        # 4. Apply lightweight local spatial mixing *after* fusion
        out = self.fuse(z_fused)

        return out

class TorchVision(nn.Module):
    """
    TorchVision module to allow loading any torchvision model.
    Adapted for standard Ultralytics parse_model:
    init(c1, c2, ...) where c1/c2 might be passed automatically.
    """

    def __init__(
        self, model: str, weights: str = "DEFAULT", unwrap: bool = True, truncate: int = 2, split: bool = False
    ):
        """
        Args:
            model: Model name
            weights: Weights enum string
            unwrap: Unwrap model
            truncate: Truncate layers
            split: Split output
        """
        super().__init__()
        import torchvision

        if hasattr(torchvision.models, "get_model"):
            self.m = torchvision.models.get_model(model, weights=weights)
        else:
            self.m = torchvision.models.__dict__[model](pretrained=bool(weights))
        
        if unwrap:
            layers = list(self.m.children())
            if isinstance(layers[0], nn.Sequential):  # Second-level for some models like EfficientNet, Swin
                layers = [*list(layers[0].children()), *layers[1:]]
            self.m = nn.Sequential(*(layers[:-truncate] if truncate else layers))
            self.split = split
        else:
            self.split = False
            self.m.head = self.m.heads = nn.Identity()

    def forward(self, x):
        if self.split:
            y = [x]
            y.extend(m(y[-1]) for m in self.m)
            return y
        else:
            return self.m(x)

class Permute(nn.Module):
    def __init__(self, dims):
        super().__init__()
        self.dims = dims
    def forward(self, x):
        if x is None:
            return x
        if isinstance(x, (list, tuple)):
            return [item.permute(self.dims) for item in x]
        return x.permute(self.dims)
