const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const replacements = [
  [
    /className="flex min-h-screen bg-\[#F5F6F8\] w-full"/g,
    'className="flex flex-col min-h-full w-full"',
  ],
  [
    /className="flex min-h-screen bg-background w-full"/g,
    'className="flex flex-col min-h-full w-full"',
  ],
  [
    /className="flex min-h-screen w-full"/g,
    'className="flex flex-col min-h-full w-full"',
  ],
  [
    /className="flex min-h-screen bg-background"/g,
    'className="flex flex-col min-h-full w-full"',
  ],
];

const files = [
  "src/pages/customer-owner/Inbox.tsx",
  "src/pages/customer-owner/Contacts.tsx",
  "src/pages/customer-owner/Analytics.tsx",
  "src/pages/customer-owner/Settings.tsx",
  "src/pages/customer-owner/Templates.tsx",
  "src/pages/customer-owner/Help.tsx",
  "src/pages/customer-owner/Billing.tsx",
  "src/pages/customer-owner/Chatbots.tsx",
  "src/pages/customer-owner/TeamMembers.tsx",
  "src/pages/customer-owner/TemplateCreate.tsx",
  "src/pages/customer-owner/Broadcasts.tsx",
  "src/pages/public/ContactGroups.tsx",
  "src/pages/public/ContactCustomFields.tsx",
  "src/components/template/TemplatePreviewPage.tsx",
];

for (const rel of files) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of replacements) {
    const next = s.replace(from, to);
    if (next !== s) {
      s = next;
      changed = true;
    }
  }
  // Collapse redundant flex-1 wrapper that only existed for sidebar sibling
  s = s.replace(
    /<div className="flex flex-col min-h-full w-full">\s*<div className="flex-1 flex flex-col min-w-0">/g,
    '<div className="flex flex-col min-h-full w-full">',
  );
  if (changed) {
    fs.writeFileSync(file, s);
    console.log("normalized", rel);
  } else {
    console.log("skip", rel);
  }
}
