const fs = require("fs");
const path = require("path");

const files = [
  "src/components/dashboard/Dashboard.tsx",
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

const root = path.join(__dirname, "..");

for (const rel of files) {
  const file = path.join(root, rel);
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  s = s.replace(
    /import\s*\{\s*Sidebar\s*\}\s*from\s*["']@\/components\/dashboard\/Sidebar["'];?\r?\n/g,
    "",
  );
  s = s.replace(/^[ \t]*<Sidebar\s*\/>\r?\n/gm, "");
  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log("updated", rel);
  } else {
    console.log("no change", rel);
  }
}
