"""
Repair knowledge base — maps each fault class to step-by-step repair instructions
that get overlaid onto the AR view. These are returned alongside model predictions.
"""

REPAIR_STEPS = {
    "cracked_screen": {
        "severity": "moderate",
        "tools": ["suction cup", "spudger", "pentalobe screwdriver", "replacement screen"],
        "steps": [
            "Power off the device completely.",
            "Remove the bottom screws with a pentalobe screwdriver.",
            "Apply suction cup near the home button and gently lift.",
            "Insert spudger into the gap and slide around the perimeter.",
            "Disconnect the display cable from the logic board.",
            "Remove the cracked screen assembly.",
            "Connect the replacement screen cable to the logic board.",
            "Press the new screen assembly into place and re-secure screws.",
        ],
    },
    "loose_display_connector": {
        "severity": "easy",
        "tools": ["pentalobe screwdriver", "spudger"],
        "steps": [
            "Power off the device.",
            "Open the device casing (remove bottom screws).",
            "Locate the display ribbon cable connector on the logic board.",
            "Gently press the connector down until it clicks into place.",
            "If the connector bracket is present, re-secure it with its screw.",
            "Reassemble the device and test the display.",
        ],
    },
    "damaged_charging_port": {
        "severity": "moderate",
        "tools": ["pentalobe screwdriver", "spudger", "tweezers", "soldering iron (if soldered)"],
        "steps": [
            "Power off and open the device.",
            "Disconnect the battery connector.",
            "Locate the charging port flex cable.",
            "Disconnect and remove the damaged charging assembly.",
            "Install the replacement charging port assembly.",
            "Reconnect the battery and reassemble.",
        ],
    },
    "battery_swelling": {
        "severity": "high",
        "tools": ["pentalobe screwdriver", "spudger", "adhesive remover", "replacement battery"],
        "steps": [
            "WARNING: Swollen batteries are a fire hazard. Work in a ventilated area.",
            "Power off the device immediately.",
            "Open the device carefully — do NOT puncture the battery.",
            "Disconnect the battery cable from the logic board.",
            "Apply adhesive remover to loosen battery adhesive tabs.",
            "Gently pry out the swollen battery (do not bend excessively).",
            "Install the replacement battery and connect the cable.",
            "Dispose of the swollen battery at a certified recycling center.",
        ],
    },
    "water_damage_corrosion": {
        "severity": "high",
        "tools": ["isopropyl alcohol (90%+)", "soft brush", "spudger", "compressed air"],
        "steps": [
            "Power off the device — do NOT attempt to charge it.",
            "Disassemble the device to expose the logic board.",
            "Identify corroded areas (green/white residue on connectors).",
            "Dip a soft brush in isopropyl alcohol and scrub corroded areas.",
            "Use compressed air to dry cleaned areas.",
            "Inspect for damaged components that may need replacement.",
            "Reassemble and test functionality.",
        ],
    },
    "broken_speaker_grille": {
        "severity": "easy",
        "tools": ["pentalobe screwdriver", "spudger", "replacement speaker"],
        "steps": [
            "Power off and open the device.",
            "Locate the speaker assembly (usually bottom of device).",
            "Disconnect and remove the damaged speaker.",
            "Install the replacement speaker.",
            "Reassemble and test audio output.",
        ],
    },
    "camera_lens_crack": {
        "severity": "easy",
        "tools": ["heat gun or hair dryer", "tweezers", "replacement lens", "adhesive"],
        "steps": [
            "Apply gentle heat around the camera lens to soften adhesive.",
            "Carefully pry out the cracked lens with tweezers.",
            "Clean the camera sensor area with a microfiber cloth.",
            "Apply adhesive ring to the new lens.",
            "Press the replacement lens into position.",
        ],
    },
    "bent_frame": {
        "severity": "high",
        "tools": ["frame press or clamp", "heat gun"],
        "steps": [
            "Remove the screen and internal components.",
            "Apply heat along the bent area to soften the metal.",
            "Place the frame in a press and apply gradual pressure.",
            "Check alignment repeatedly — do not over-bend.",
            "Reassemble components and verify screen sits flush.",
        ],
    },
    "broken_hinge": {
        "severity": "moderate",
        "tools": ["phillips screwdriver", "spudger", "replacement hinge"],
        "steps": [
            "Open the laptop to ~90 degrees.",
            "Remove the bottom panel screws and bezel around the hinge.",
            "Disconnect the display cable routed through the hinge.",
            "Unscrew and remove the broken hinge.",
            "Install the replacement hinge and tighten screws.",
            "Re-route the display cable and reassemble.",
        ],
    },
    "damaged_keyboard": {
        "severity": "moderate",
        "tools": ["phillips screwdriver", "spudger", "replacement keyboard"],
        "steps": [
            "Power off and flip the laptop over.",
            "Remove the bottom panel.",
            "Disconnect the keyboard ribbon cable from the motherboard.",
            "Remove screws holding the keyboard in place.",
            "Lift out the damaged keyboard.",
            "Place the replacement keyboard and reconnect the ribbon cable.",
            "Reassemble the laptop.",
        ],
    },
    "swollen_battery": {
        "severity": "high",
        "tools": ["phillips screwdriver", "spudger", "replacement battery"],
        "steps": [
            "WARNING: Swollen batteries are a fire hazard.",
            "Power off and unplug the laptop.",
            "Remove the bottom panel.",
            "Disconnect the battery cable.",
            "Remove mounting screws and carefully extract the battery.",
            "Install the replacement battery.",
            "Dispose of the swollen battery at a recycling center.",
        ],
    },
    "loose_ram_module": {
        "severity": "easy",
        "tools": ["phillips screwdriver"],
        "steps": [
            "Power off and remove the bottom panel.",
            "Locate the RAM slot.",
            "Press down on the RAM module until the side clips click.",
            "If the module is damaged, replace with a compatible stick.",
            "Reassemble and boot to verify RAM is detected in BIOS.",
        ],
    },
    "damaged_fan": {
        "severity": "moderate",
        "tools": ["phillips screwdriver", "compressed air", "replacement fan"],
        "steps": [
            "Power off and remove the bottom panel.",
            "Disconnect the fan cable from the motherboard.",
            "Remove the fan mounting screws.",
            "Clean out dust buildup with compressed air.",
            "Install the replacement fan and reconnect.",
            "Reassemble and verify fan spins on boot.",
        ],
    },
    "broken_trackpad": {
        "severity": "moderate",
        "tools": ["phillips screwdriver", "spudger", "replacement trackpad"],
        "steps": [
            "Remove the laptop bottom panel.",
            "Disconnect the trackpad ribbon cable.",
            "Remove trackpad mounting screws.",
            "Install the replacement trackpad.",
            "Reconnect the ribbon cable and reassemble.",
        ],
    },
    "burnt_component": {
        "severity": "high",
        "tools": ["multimeter", "soldering iron", "solder wick", "replacement component"],
        "steps": [
            "Visually identify the burnt component (discoloration/char marks).",
            "Use a multimeter to confirm the component has failed.",
            "Note the component value/marking for replacement.",
            "Desolder the burnt component using solder wick.",
            "Clean the pads with isopropyl alcohol.",
            "Solder the replacement component.",
            "Test the circuit for correct operation.",
        ],
    },
    "cold_solder_joint": {
        "severity": "easy",
        "tools": ["soldering iron", "solder", "flux"],
        "steps": [
            "Identify the cold joint (dull, grainy, or cracked solder).",
            "Apply flux to the joint.",
            "Touch the soldering iron to the joint to reflow the solder.",
            "Add a small amount of fresh solder if needed.",
            "The joint should now appear shiny and smooth.",
            "Test the circuit for restored connectivity.",
        ],
    },
    "blown_capacitor": {
        "severity": "moderate",
        "tools": ["soldering iron", "solder wick", "replacement capacitor", "multimeter"],
        "steps": [
            "Identify the blown capacitor (bulging top, leaked electrolyte).",
            "Note the capacitance value and voltage rating.",
            "Desolder the blown capacitor.",
            "Clean the pads.",
            "Solder the replacement capacitor (observe polarity).",
            "Test the board for correct operation.",
        ],
    },
    "corroded_trace": {
        "severity": "high",
        "tools": ["multimeter", "isopropyl alcohol", "soldering iron", "wire", "solder mask"],
        "steps": [
            "Identify the corroded trace visually.",
            "Clean the area with isopropyl alcohol.",
            "Use a multimeter to confirm the trace is broken.",
            "Scrape away corrosion to expose clean copper on both ends.",
            "Bridge the gap with a thin wire soldered to both ends.",
            "Apply solder mask or conformal coating over the repair.",
        ],
    },
    "cracked_pcb": {
        "severity": "high",
        "tools": ["multimeter", "soldering iron", "thin wire", "epoxy"],
        "steps": [
            "Identify all broken traces across the crack with a multimeter.",
            "Clean both sides of the crack.",
            "Apply epoxy to stabilize the physical crack.",
            "Bridge each broken trace with thin wire soldered at both ends.",
            "Verify continuity for every repaired trace.",
            "Apply conformal coating over repairs.",
        ],
    },
    "missing_component": {
        "severity": "moderate",
        "tools": ["multimeter", "soldering iron", "solder", "replacement component"],
        "steps": [
            "Identify the missing component location on the PCB.",
            "Check the board schematic or reference board for component value.",
            "Clean the solder pads.",
            "Apply solder paste or flux to the pads.",
            "Place and solder the replacement component.",
            "Test the circuit.",
        ],
    },
    "bent_cpu_pin": {
        "severity": "high",
        "tools": ["magnifying glass", "mechanical pencil (0.5mm)", "tweezers"],
        "steps": [
            "Identify bent pins under magnification.",
            "Use an empty mechanical pencil tip to slide over the pin.",
            "Gently straighten the pin back to vertical alignment.",
            "Check all surrounding pins for alignment.",
            "Test by carefully seating the CPU and booting.",
        ],
    },
    "damaged_pcie_slot": {
        "severity": "high",
        "tools": ["soldering iron", "hot air station", "replacement slot"],
        "steps": [
            "Inspect the slot for broken or bent pins.",
            "If pins are bent, carefully straighten with tweezers.",
            "If the slot is cracked, desolder it with hot air.",
            "Clean the pads and solder a replacement slot.",
            "Test with a known-good PCIe card.",
        ],
    },
    "bulging_capacitor": {
        "severity": "moderate",
        "tools": ["soldering iron", "solder wick", "replacement capacitor"],
        "steps": [
            "Identify all bulging capacitors on the board.",
            "Note voltage rating and capacitance of each.",
            "Desolder and remove the bulging capacitors.",
            "Solder replacements (observe correct polarity).",
            "Power on and verify stable operation.",
        ],
    },
    "burnt_vrm": {
        "severity": "high",
        "tools": ["multimeter", "soldering iron", "hot air station", "replacement VRM"],
        "steps": [
            "Identify the burnt VRM (discoloration, smell).",
            "Use a multimeter to check for short circuits.",
            "Remove the burnt VRM with hot air.",
            "Clean the pads thoroughly.",
            "Solder the replacement VRM.",
            "Verify output voltage is within specification before reconnecting.",
        ],
    },
    "broken_dimm_slot": {
        "severity": "high",
        "tools": ["soldering iron", "hot air station", "replacement DIMM slot"],
        "steps": [
            "Inspect the slot for cracked plastic or broken pins.",
            "If repairable, carefully straighten bent pins.",
            "Otherwise, desolder the slot with hot air.",
            "Clean pads and solder the replacement slot.",
            "Test with a known-good RAM stick.",
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
