export const mockConversation = [
  {
    step: 1,
    title: "Identify the damage",
    exchanges: [
      {
        speaker: "ai",
        text: "I can see your iPhone 14. Let me get a closer look at the damage. Can you hold it steady and tilt it slightly toward me?",
        arAnnotations: ["highlight-screen"],
      },
      {
        speaker: "user",
        text: "Yeah sure, the crack is mainly on the top right.",
      },
      {
        speaker: "ai",
        text: "Got it — I can see the fracture pattern starting from the top-right corner. This is a standard screen replacement. Let me walk you through it. First, power off your phone completely.",
        arAnnotations: ["arrow-power-button"],
      },
    ],
  },
  {
    step: 2,
    title: "Power off & remove screws",
    exchanges: [
      {
        speaker: "ai",
        text: "Great, the phone is off. Now grab your pentalobe screwdriver. See those two tiny screws on either side of the charging port? We need to remove those.",
        arAnnotations: ["circle-screws"],
      },
      {
        speaker: "user",
        text: "Okay, I got the screwdriver. They're really small.",
      },
      {
        speaker: "ai",
        text: "They are! Go slowly and keep the screws somewhere safe — I'd suggest a magnetic mat or a piece of tape. They're easy to lose. Let me know when both are out.",
      },
      {
        speaker: "user",
        text: "Both screws are out.",
      },
    ],
  },
  {
    step: 3,
    title: "Heat & separate the screen",
    exchanges: [
      {
        speaker: "ai",
        text: "Perfect. Now take your heat gun or hair dryer. We need to warm the edges of the screen to soften the adhesive. Move it slowly along the bottom edge for about 90 seconds.",
        arAnnotations: ["highlight-bottom-edge"],
      },
      {
        speaker: "user",
        text: "How hot should it get? I don't want to damage anything.",
      },
      {
        speaker: "ai",
        text: "Keep it on low — you want it warm to the touch, not burning. About 80°C is ideal. Now place the suction cup on the lower third of the screen and pull up gently while sliding the spudger into the gap.",
        arAnnotations: ["suction-cup-position"],
      },
    ],
  },
  {
    step: 4,
    title: "Disconnect display cables",
    exchanges: [
      {
        speaker: "ai",
        text: "Good, the screen is lifting. Open it like a book — hinge it from the right side. Be careful not to pull too hard, there are ribbon cables still connected.",
        arAnnotations: ["highlight-cables"],
      },
      {
        speaker: "user",
        text: "I can see three connectors.",
      },
      {
        speaker: "ai",
        text: "Exactly. There's a metal bracket held by three screws covering those connectors. Remove the bracket screws first, then use the spudger to gently pop each connector straight up. Start from the bottom one.",
        arAnnotations: ["arrow-bracket-screws", "arrow-connector-bottom"],
      },
      {
        speaker: "user",
        text: "All three are disconnected. The old screen is free.",
      },
    ],
  },
  {
    step: 5,
    title: "Install new screen",
    exchanges: [
      {
        speaker: "ai",
        text: "Excellent work! Now take your new screen assembly. We'll connect the cables in reverse order — start with the top connector and work down. Press each one firmly until you feel it click.",
        arAnnotations: ["arrow-connector-top"],
      },
      {
        speaker: "user",
        text: "The connectors are in. Putting the bracket back.",
      },
      {
        speaker: "ai",
        text: "Make sure the bracket screws go back in the same holes — they may be slightly different lengths. Once the bracket is secure, gently fold the screen down and press along the edges until it seats flush.",
        arAnnotations: ["highlight-screen-edges"],
      },
    ],
  },
  {
    step: 6,
    title: "Reassemble & test",
    exchanges: [
      {
        speaker: "ai",
        text: "Almost there! Reinstall the two pentalobe screws at the bottom. Then power on the phone and let's test everything.",
        arAnnotations: ["circle-screws"],
      },
      {
        speaker: "user",
        text: "It's turning on! The screen looks great.",
      },
      {
        speaker: "ai",
        text: "Awesome! Let's run through a quick checklist — try swiping around, test Face ID, check the brightness slider, and make sure touch works in all four corners. How does everything feel?",
      },
      {
        speaker: "user",
        text: "Everything's working perfectly. Thank you so much!",
      },
      {
        speaker: "ai",
        text: "You did it! Your iPhone 14 screen replacement is complete. Great job — you just saved yourself a trip to the repair shop.",
      },
    ],
  },
];
