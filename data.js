/* data.js - Οριστικό & Ιδανικό Πρόγραμμα για Pegasus MS600 */

const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];

const program = {
    "Δευτέρα": [
        { name: "Stretching", sets: 1, duration: 338 }
    ],
    "Τρίτη": [
        { name: "Seated Chest Press", sets: 3, duration: 45 },
        { name: "Pec Deck", sets: 3, duration: 45 },
        { name: "Lat Pulldown", sets: 3, duration: 45 },
        { name: "Low Seated Row", sets: 3, duration: 45 },
        { name: "Preacher Curl", sets: 3, duration: 45 },
        { name: "Plank", sets: 3, duration: 45 },
        { name: "Reverse Crunch", sets: 3, duration: 45 }
    ],
    "Τετάρτη": [
        { name: "EMS Κοιλιακών", sets: 1, duration: 45 },
        { name: "EMS Πλάτης", sets: 1, duration: 45 },
        { name: "EMS Ποδιών", sets: 1, duration: 45 }
    ],
    "Πέμπτη": [
        { name: "Stretching", sets: 1, duration: 338 }
    ],
    "Παρασκευή": [
        { name: "Leg Extension", sets: 4, duration: 45 },
        { name: "Pushups", sets: 4, duration: 45 },
        { name: "Lying Knee Raise", sets: 4, duration: 45 },
        { name: "Reverse Crunch", sets: 4, duration: 45 },
        { name: "Leg Raise Hip Lift", sets: 4, duration: 45 }
    ],
    "Σάββατο": [
        { name: "Reverse Chest Press", sets: 4, duration: 45 },
        { name: "Close Grip Pulldown", sets: 4, duration: 45 },
        { name: "Reverse Grip Cable Row", sets: 4, duration: 45 }, 
        { name: "Standing Bicep Curl", sets: 3, duration: 45 },
        { name: "Triceps Press", sets: 3, duration: 45 }
    ],
    "Κυριακή": [
        { name: "Behind the Neck Pulldown", sets: 3, duration: 45 },
        { name: "Low Seated Row", sets: 3, duration: 45 },
        { name: "Triceps Overhead Extension", sets: 3, duration: 45 },
        { name: "Preacher Curl", sets: 3, duration: 45 },
        { name: "Lying Knee Raise", sets: 3, duration: 45 },
        { name: "Reverse Crunch", sets: 3, duration: 45 },
        { name: "Leg Raise Hip Lift", sets: 3, duration: 45 }
    ]
};

const videoMap = {
    "Lat Pulldown": "Pulldown",
    "Close Grip Pulldown": "Pulldown",
    "Behind the Neck Pulldown": "Pulldown",
    "Low Seated Row": "LowSeatedRow",
    "Reverse Grip Cable Row": "ReverseGripCableRow",
    "Reverse Chest Press": "reverserow", 
    "Seated Chest Press": "SeatedChestPress",
    "Pec Deck": "Pecdeck",
    "Pushups": "Pushups",
    "Preacher Curl": "biceps",
    "Standing Bicep Curl": "Bicepscurl",
    "Triceps Overhead Extension": "Tricepspress",
    "Triceps Press": "Tricepspress",
    "Leg Extension": "LegExtensions",
    "Plank": "Plank",
    "Stretching": "stretching",
    "Lying Knee Raise": "LyingKneeRaise",
    "Reverse Crunch": "ReverseCrunch",
    "Leg Raise Hip Lift": "LegRaiseHipLift",
    "EMS Κοιλιακών": "EMS_K",
    "EMS Πλάτης": "EMS_P",
    "EMS Ποδιών": "EMS_L"
};