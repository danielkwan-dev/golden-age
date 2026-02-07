"""
Repair knowledge base — maps each fault class to step-by-step repair instructions
that get overlaid onto the AR view. These are returned alongside model predictions.

Classes match the merged dataset (phone_damage + screen_damage):
  0: phone           - intact phone (no damage)
  1: phone_damage    - general physical damage
  2: body_lecet      - body scratch
  3: body_retak      - body crack
  4: lcd_garis       - LCD line/streak
  5: lcd_retak       - LCD crack
  6: lcd_rusak       - LCD broken/dead
  7: smartphone      - smartphone device detection
"""

REPAIR_STEPS = {
    "phone": {
        "severity": "none",
        "tools": [],
        "steps": [
            "No damage detected — this phone appears intact.",
            "If you suspect hidden damage, inspect the charging port and buttons.",
        ],
    },
    "phone_damage": {
        "severity": "moderate",
        "tools": ["pentalobe screwdriver", "spudger", "suction cup", "replacement parts (varies)"],
        "steps": [
            "Identify the specific area and type of damage.",
            "Power off the device completely.",
            "If external damage: inspect for cracks, dents, or bent frame.",
            "If functional damage: test charging, buttons, speakers, and cameras.",
            "Open the device casing to check for internal damage.",
            "Replace any damaged components identified.",
            "Reassemble and test all functions.",
        ],
    },
    "body_lecet": {
        "severity": "easy",
        "tools": ["microfiber cloth", "scratch remover paste", "phone case"],
        "steps": [
            "Clean the scratched area with a microfiber cloth.",
            "Apply a small amount of scratch remover paste.",
            "Buff in circular motions for 30-60 seconds.",
            "Wipe clean and inspect — repeat if needed.",
            "For deep scratches, consider a back panel replacement.",
            "Apply a protective case to prevent further scratches.",
        ],
    },
    "body_retak": {
        "severity": "moderate",
        "tools": ["pentalobe screwdriver", "spudger", "replacement back panel", "adhesive"],
        "steps": [
            "Power off the device.",
            "Apply heat to loosen the back panel adhesive.",
            "Use a suction cup and spudger to carefully remove the cracked panel.",
            "Clean residual adhesive from the frame.",
            "Apply new adhesive strips to the frame.",
            "Press the replacement back panel into place.",
            "Allow adhesive to cure before using the device.",
        ],
    },
    "lcd_garis": {
        "severity": "moderate",
        "tools": ["pentalobe screwdriver", "spudger", "suction cup"],
        "steps": [
            "Lines on the LCD may indicate a loose display connector.",
            "Power off the device.",
            "Open the device and locate the display ribbon cable.",
            "Disconnect and firmly reconnect the display cable.",
            "If lines persist, the LCD panel itself is damaged.",
            "Replace the full display assembly if reconnecting did not help.",
            "Reassemble and verify the display is clear.",
        ],
    },
    "lcd_retak": {
        "severity": "moderate",
        "tools": ["suction cup", "spudger", "pentalobe screwdriver", "replacement screen assembly"],
        "steps": [
            "Power off the device completely.",
            "Remove bottom screws with a pentalobe screwdriver.",
            "Apply suction cup near the bottom edge and gently lift.",
            "Slide a spudger around the perimeter to release clips.",
            "Disconnect the display cable from the logic board.",
            "Remove the cracked display assembly.",
            "Connect the replacement display cable.",
            "Press the new screen into place and re-secure all screws.",
        ],
    },
    "lcd_rusak": {
        "severity": "high",
        "tools": ["suction cup", "spudger", "pentalobe screwdriver", "replacement screen assembly", "heat gun"],
        "steps": [
            "WARNING: A fully broken LCD may have sharp edges — handle carefully.",
            "Power off the device and disconnect the battery if possible.",
            "Apply heat around the screen edges to soften adhesive.",
            "Use suction cup and spudger to remove the broken display.",
            "Carefully remove any glass fragments from the frame.",
            "Disconnect the display cable from the logic board.",
            "Clean the frame and remove old adhesive.",
            "Install the replacement display assembly.",
            "Reconnect all cables, reassemble, and test.",
        ],
    },
    "smartphone": {
        "severity": "none",
        "tools": [],
        "steps": [
            "Smartphone detected — inspecting for damage.",
            "Point the camera at the damaged area for a closer look.",
            "Describe the issue verbally for better diagnosis.",
        ],
    },
}


def get_repair_info(fault_label: str) -> dict:
    """Return repair steps for a given fault label."""
    return REPAIR_STEPS.get(fault_label, {
        "severity": "unknown",
        "tools": [],
        "steps": ["No repair guide available for this fault type."],
    })
