const mockDiagnosisResponse = {
  device: "iPhone 13",
  problem: "Cracked Screen",
  difficulty: "Moderate",
  estimatedTime: "45–60 minutes",
  tools: [
    "Pentalobe screwdriver",
    "Suction cup",
    "Spudger",
    "Replacement screen assembly",
    "Heat gun or hair dryer",
  ],
  steps: [
    {
      title: "Power off the device",
      description:
        "Hold the side button and volume down until the power-off slider appears. Slide to power off and wait 30 seconds.",
    },
    {
      title: "Remove the pentalobe screws",
      description:
        "Remove the two pentalobe screws on either side of the Lightning/USB-C port at the bottom of the phone.",
    },
    {
      title: "Apply heat to loosen adhesive",
      description:
        "Use a heat gun or hair dryer on low setting along the edges of the screen for 1–2 minutes to soften the adhesive.",
    },
    {
      title: "Attach suction cup and lift screen",
      description:
        "Place the suction cup on the lower half of the screen. Pull firmly while inserting a spudger into the gap to separate the screen from the frame.",
    },
    {
      title: "Disconnect display cables",
      description:
        "Open the phone like a book. Remove the bracket screws and carefully disconnect the three display ribbon cables using a spudger.",
    },
    {
      title: "Install the new screen",
      description:
        "Connect the new screen's ribbon cables, secure the bracket, and gently press the screen into the frame until it clicks into place.",
    },
    {
      title: "Replace screws and test",
      description:
        "Reinstall the two pentalobe screws. Power on the device and test touch responsiveness, Face ID, and display quality.",
    },
  ],
  warnings: [
    "Disconnect the battery before working on internal components.",
    "Work on a clean, static-free surface.",
    "Keep track of all screws — they are different sizes.",
  ],
};

export default mockDiagnosisResponse;
