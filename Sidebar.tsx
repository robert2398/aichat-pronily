import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import SideItem from "./SideItem";
import { ChevronRight, Compass, UserPlus, Star, User, MessageSquare, Cpu, Image, CreditCard, Globe, LifeBuoy, Mail, Link, Gamepad, Menu } from 'lucide-react';

type Props = {
	sidebarOpen: boolean;
	sidebarCollapsed: boolean;
	setSidebarCollapsed: (v: React.SetStateAction<boolean>) => void;
	setSidebarOpen: (v: React.SetStateAction<boolean>) => void;
	selectedItem: string;
	setSelectedItem: (item: string) => void;
};

export const Sidebar: React.FC<Props> = ({ sidebarOpen, sidebarCollapsed, setSidebarCollapsed, setSidebarOpen, selectedItem, setSelectedItem }) => {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const isDark = theme === "dark";

	function getPathForLabel(label: string) {
		switch (label) {
			case "Explore":
				return "/";
			case "Create Character":
				return "/create-character";
			case "Generate Image":
				return "/generate-image";
			case "Profile":
				return "/profile";
			case "Chat":
				return "/chat";
			case "My AI":
				return "/my-ai";
			case "Gallery":
				return "/gallery";
			case "Buy Token":
				return "/buy-tokens";
			case "Language":
				return "/language";
			case "Help Center":
				return "/help-center";
			case "Contact Us":
				return "/contact-center";
			case "Affiliate":
				return "/affiliate";
			case "Discord":
				return "/discord";
			default:
				return undefined;
		}
	}

	function getLabelForPath(path: string) {
		switch (path) {
			case "/":
				return "Explore";
			case "/create-character":
				return "Create Character";
			case "/generate-image":
				return "Generate Image";
			case "/profile":
				return "Profile";
			case "/chat":
				return "Chat";
			case "/my-ai":
				return "My AI";
			case "/gallery":
				return "Gallery";
			case "/buy-tokens":
				return "Buy Token";
			default:
				return undefined;
		}
	}

	const location = useLocation();

	// keep selectedItem in sync with the current route (useful when loading a direct URL)
	React.useEffect(() => {
		const label = getLabelForPath(location.pathname);
		if (label) setSelectedItem(label);
	}, [location.pathname, setSelectedItem]);

	function handleItemClick(label: string) {
		setSelectedItem(label);
		const path = getPathForLabel(label);
		if (path) {
			navigate(path);
			// close the sidebar on small screens after navigation
			try {
				if (sidebarOpen) setSidebarOpen(false as any);
			} catch {}
		}
	}
	
	return (
		<>
			{/* overlay for small screens when sidebar is open */}
			<div 
				className={`md:hidden transition-opacity duration-300 ${sidebarOpen ? 'fixed inset-0 z-40 bg-black/50 opacity-100' : 'hidden opacity-0'}`}
				onClick={() => setSidebarOpen(false)}
			/>

			<aside
				onDoubleClick={() => setSidebarCollapsed((v) => !v)}
				style={{
					top: "var(--header-h)",
					height: "calc(100vh - var(--header-h))",
				} as React.CSSProperties}
				className={`${sidebarOpen ? "fixed z-50 left-0" : "hidden"} md:fixed md:left-0 md:z-50 md:block transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-16" : "w-60"} shrink-0 border-r ${sidebarCollapsed ? 'overflow-visible' : 'overflow-hidden'} theme-transition ${
					isDark 
						? "bg-[var(--hl-black)] border-white/8" 
						: "bg-white border-gray-200"
				}`}
			>
				<div className={`flex h-full w-full flex-col transition-all duration-300 py-2 ${sidebarCollapsed ? "px-2.5" : "px-3"}`}>
					<div className={`mb-2 flex items-center h-12 ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-2"}`}>
						{!sidebarCollapsed && (
						<div className="flex items-center gap-3">
				<Menu className={`h-5 w-5 text-[var(--hl-gold)]`} />
					<span className={`text-base text-[var(--hl-gold)] font-medium`}>Menu</span>
								</div>
						)}
						<button 
							aria-label="Collapse sidebar" 
							onClick={() => setSidebarCollapsed((v) => !v)} 
							className={`grid h-9 w-9 place-items-center rounded-md transition-all duration-200 ${
								isDark 
									? `hover:bg-white/10 ${sidebarCollapsed ? "bg-white/5" : ""}` 
									: `hover:bg-gray-100 ${sidebarCollapsed ? "bg-gray-50" : ""}`
							}`}
						>
							<ChevronRight className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : "rotate-0"} ${isDark ? "text-white/60" : "text-gray-500"}`} />
						</button>
					</div>

					<nav className={`${sidebarCollapsed ? 'overflow-y-auto overflow-x-visible no-scrollbar' : 'overflow-y-auto overflow-x-hidden no-scrollbar'} flex-1`}>
						<ul className={`space-y-1 py-1 ${sidebarCollapsed ? "px-0" : "px-1"}`}>
							<SideItem icon={<Compass className="h-4 w-4" />} label="Explore" active={selectedItem === "Explore"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Explore")} />
							<SideItem icon={<UserPlus className="h-4 w-4" />} label="Create Character" active={selectedItem === "Create Character"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Create Character")} />
							<SideItem icon={<Star className="h-4 w-4" />} label="Generate Image" active={selectedItem === "Generate Image"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Generate Image")} />
							<SideItem icon={<User className="h-4 w-4" />} label="Profile" active={selectedItem === "Profile"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Profile")} />
							<SideItem icon={<MessageSquare className="h-4 w-4" />} label="Chat" active={selectedItem === "Chat"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Chat")} />
							<SideItem icon={<Cpu className="h-4 w-4" />} label="My AI" active={selectedItem === "My AI"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("My AI")} />
							<SideItem icon={<Image className="h-4 w-4" />} label="Gallery" pill sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Gallery")} />
							<SideItem icon={<CreditCard className="h-4 w-4" />} label="Buy Token" active={selectedItem === "Buy Token"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Buy Token")} />
						</ul>
						<div className={`my-3 ${sidebarCollapsed ? "mx-1" : "mx-0"} border-t ${isDark ? "border-[var(--hl-gold)]/22 shadow-[0_1px_0_rgba(255,197,77,0.06)]" : "border-[var(--hl-gold)]/14"}`} />
						<ul className={`space-y-1 py-1 ${sidebarCollapsed ? "px-0" : "px-1"}`}>
							<SideItem icon={<Globe className="h-4 w-4" />} label="Language" active={selectedItem === "Language"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Language")} />
							<SideItem icon={<LifeBuoy className="h-4 w-4" />} label="Help Center" active={selectedItem === "Help Center"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Help Center")} />
							<SideItem icon={<Mail className="h-4 w-4" />} label="Contact Us" active={selectedItem === "Contact Us"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Contact Us")} />
							<SideItem icon={<Link className="h-4 w-4" />} label="Affiliate" active={selectedItem === "Affiliate"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Affiliate")} />
							<SideItem icon={<Gamepad className="h-4 w-4" />} label="Discord" active={selectedItem === "Discord"} sidebarCollapsed={sidebarCollapsed} onClick={() => handleItemClick("Discord")} />
						</ul>
					</nav>
				</div>
			</aside>
		</>
	);
};

export default Sidebar;
