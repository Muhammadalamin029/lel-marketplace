import BrowseScreen from "../browse";

// Shop tab — same screen as the /browse stack route (explicit wrapper:
// expo-router static analysis can't follow bare re-exports).
export default function ShopTab() {
  return <BrowseScreen />;
}
