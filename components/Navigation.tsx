import type { Tab } from "@/types";

type NavigationProps = {
    activeTab: Tab;
    isAdmin: boolean;
    onTabChange: (tab: Tab) => void;
};

const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: "mine", label: "Pronòstics" },
    { key: "awards", label: "Premis" },
    { key: "publicAwards", label: "Premis dels altres" },
    { key: "groups", label: "Grups" },
    { key: "others", label: "Porres" },
    { key: "standings", label: "Classificació" },
    { key: "admin", label: "Admin", adminOnly: true },
];

export function Navigation({
    activeTab,
    isAdmin,
    onTabChange,
}: NavigationProps) {
    return (
        <nav className="tabs">
            {tabs
                .filter((tab) => !tab.adminOnly || isAdmin)
                .map((tab) => (
                    <button
                        key={tab.key}
                        className={activeTab === tab.key ? "tab active" : "tab"}
                        onClick={() => onTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
        </nav>
    );
}