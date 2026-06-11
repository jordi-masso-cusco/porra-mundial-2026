import type { Tab } from "@/types";

type NavigationProps = {
    activeTab: Tab;
    isAdmin: boolean;
    onTabChange: (tab: Tab) => void;
};

export function Navigation({ activeTab, isAdmin, onTabChange }: NavigationProps) {
    const buttonStyle = (tab: Tab) => ({
        padding: "8px 12px",
        fontWeight: activeTab === tab ? "bold" : "normal",
    });

    return (
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <button style={buttonStyle("mine")} onClick={() => onTabChange("mine")}>
                Els meus pronòstics
            </button>

            <button style={buttonStyle("awards")} onClick={() => onTabChange("awards")}>
                Premis individuals
            </button>

            <button style={buttonStyle("groups")} onClick={() => onTabChange("groups")}>
                Grups calculats
            </button>

            <button style={buttonStyle("others")} onClick={() => onTabChange("others")}>
                Porres dels altres
            </button>

            <button
                style={buttonStyle("standings")}
                onClick={() => onTabChange("standings")}
            >
                Classificació
            </button>

            {isAdmin && (
                <button style={buttonStyle("admin")} onClick={() => onTabChange("admin")}>
                    Admin
                </button>
            )}
        </div>
    );
}