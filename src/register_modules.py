import ultralytics.nn.tasks
import ultralytics.nn.modules
import torchvision
from custom_modules import Index, BiFusionSE, TorchVision, Permute

def register_all_modules():
    """
    Registers custom modules into Ultralytics' tasks and modules registries
    and applies necessary monkey-patches for compatibility.
    """
    # 1. Register Custom Modules
    # Inject into ultralytics.nn.tasks because parse_model looks in globals() of that module
    setattr(ultralytics.nn.tasks, 'Index', Index)
    setattr(ultralytics.nn.tasks, 'BiFusionSE', BiFusionSE)
    setattr(ultralytics.nn.tasks, 'TorchVision', TorchVision)
    setattr(ultralytics.nn.tasks, 'Permute', Permute)

    # Also inject into modules just in case
    setattr(ultralytics.nn.modules, 'Index', Index)
    setattr(ultralytics.nn.modules, 'BiFusionSE', BiFusionSE)
    setattr(ultralytics.nn.modules, 'TorchVision', TorchVision)
    setattr(ultralytics.nn.modules, 'Permute', Permute)
    
    # 2. Patch torchvision.ops.Permute - REMOVED to avoid PicklingError
    # We do NOT want to replace the real torchvision Permute because standard models (like ConvNeXt)
    # allow pickle to save them. If we replace the class in the module, pickle gets confused
    # between the internal instances (original class) and the module attribute (our custom class).
    # try:
    #     import torchvision.ops
    #     import torchvision.ops.misc
    #     setattr(torchvision.ops, 'Permute', Permute)
    #     setattr(torchvision.ops.misc, 'Permute', Permute)
    # except Exception as e:
    #     print(f"Warning: Could not patch torchvision: {e}")

    # 3. Patch parse_model
    # Use custom implementation to support BiFusionSE list inputs and Detect args
    from custom_tasks import parse_model as custom_parse_model
    ultralytics.nn.tasks.parse_model = custom_parse_model

# Execute immediately when imported? 
# Better to have a function to call, or just run on import.
# Given how python imports work, running on import is easiest for the user scripts.
register_all_modules()
