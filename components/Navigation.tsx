import type { Tab } from "@/types";

type NavigationProps = {
    activeTab: Tab;
    isAdmin: boolean;
    publicTabsEnabled: boolean;
    onTabChange: (tab: Tab) => void;
};

const tabs: {
    key: Tab;
    label: string;
    adminOnly?: boolean;
    publicOnlyAfterClose?: boolean;
}[] = [
        { key: "mine", label: "Pronòstics" },
        { key: "others", label: "Porres", publicOnlyAfterClose: true },
        { key: "standings", label: "Classificació" },
        { key: "admin", label: "Admin", adminOnly: true },
    ];

export function Navigation({
    activeTab,
    isAdmin,
    publicTabsEnabled,
    onTabChange,
}: NavigationProps) {
    return (
        <nav className="tabs">
            {tabs
                .filter((tab) => {
                    if (tab.adminOnly && !isAdmin) return false;
                    if (tab.publicOnlyAfterClose && !publicTabsEnabled && !isAdmin) return false;
                    return true;
                })
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