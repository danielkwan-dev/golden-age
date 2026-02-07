# --- THE CRAFTSMAN'S HANDBOOK ---
# Transforming knowledge into action.
# Restoring the harmony of the circuit.

def generate_steps(fault_type: str, bbox: list):
    """
    Generate AR-ready repair instructions for the detected anomaly.
    """
    fault_map = {
        "burnt_resistor": [
            {
                "step": 1,
                "instruction": "Identify the scorched resistor and isolate power.",
                "tools": ["safety goggles", "multimeter"],
                "overlay": {
                    "type": "circle",
                    "bbox": bbox,
                    "text": "Danger: Burnt Component",
                    "color": "#FFD700" 
                }
            },
            {
                "step": 2,
                "instruction": "Desolder the component using a wick or pump.",
                "tools": ["soldering iron", "desolder wick"],
                "overlay": {
                    "type": "arrow",
                    "bbox": bbox,
                    "text": "Heat here to release",
                    "color": "#FFD700"
                }
            },
            {
                "step": 3,
                "instruction": "Clean the pads with isopropyl alcohol.",
                "tools": ["swab", "IPA"],
                "overlay": {
                    "type": "highlight",
                    "bbox": bbox,
                    "text": "Clean Pad Area",
                    "color": "#FFD700"
                }
            }
        ],
        "cracked_screen": [
            {
                "step": 1,
                "instruction": "Apply heating pad to soften adhesive.",
                "tools": ["heat gun", "suction cup"],
                "overlay": {
                    "type": "area",
                    "bbox": bbox,
                    "text": "Apply Heat Uniformly",
                    "color": "#FFD700"
                }
            }
        ],
        "corroded_contact": [
            {
                "step": 1,
                "instruction": "Gently scrape away oxidation.",
                "tools": ["fiberglass pen", "IPA"],
                "overlay": {
                    "type": "arrow",
                    "bbox": bbox,
                    "text": "Remove Blue Oxidation",
                    "color": "#FFD700"
                }
            }
        ]
    }

    # Default steps for unknown suffering
    default_steps = [
        {
            "step": 1,
            "instruction": "Examine the component for structural integrity.",
            "tools": ["magnifying glass"],
            "overlay": {
                "type": "box",
                "bbox": bbox if bbox else [0,0,100,100],
                "text": f"Analyze: {fault_type}",
                "color": "#FFD700"
            }
        },
        {
            "step": 2,
            "instruction": "Test continuity with a multimeter.",
            "tools": ["multimeter"],
            "overlay": {
                "type": "point",
                "bbox": bbox if bbox else [0,0,10,10],
                "text": "Test Points",
                "color": "#FFD700"
            }
        }
    ]

    return fault_map.get(fault_type, default_steps)

def get_tools_needed(steps: list):
    """Aggregate all necessary instruments for the restoration."""
    tools = set()
    for step in steps:
        for tool in step.get("tools", []):
            tools.add(tool)
    return list(tools)
