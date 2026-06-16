import * as Icons from "phosphor-react-native";
import { CategoryType, ExpenseCategoriesType } from "../../types";

export const expenseCategories: ExpenseCategoriesType = {
    
    supermarket: {
        label: "Supermercado",
        value: "supermarket",
        icon: Icons.Storefront,
        bgColor: "#819abd"
    },
    groceries: {
        label: "Comestibles",
        value: "groceries",
        icon: Icons.ShoppingCart,
        bgColor: "#4B5563"
    },
    rent: {
        label: "Renta",
        value: "rent",
        icon: Icons.House,
        bgColor: "#075985"
    },
    services: {
        label: "Servicios",
        value: "services",
        icon: Icons.Lightbulb,
        bgColor: "#CA8A04"
    },
    transportation: {
        label: "Transporte",
        value: "transportation",
        icon: Icons.Car,
        bgColor: "#B45309"
    },
    entertainmet: {
        label: "Entretenimiento",
        value: "entertainmet",
        icon: Icons.FilmStrip,
        bgColor: "#0F766E"
    },
    dining: {
        label: "Comida",
        value: "dining",
        icon: Icons.ForkKnife,
        bgColor: "#BE185D"
    },
    health: {
        label: "Salud",
        value: "health",
        icon: Icons.Heart,
        bgColor: "#E11D48"
    },
    insurance: {
        label: "Seguro",
        value: "insurance",
        icon: Icons.ShieldCheck,
        bgColor: "#404040"
    },
    saving: {
        label: "Ahorros",
        value: "saving",
        icon: Icons.PiggyBank,
        bgColor: "#065F46"
    },
    clothing: {
        label: "Ropa",
        value: "clothing",
        icon: Icons.TShirt,
        bgColor: "#7c3aed"
    },
    personal: {
        label: "Personal",
        value: "personal",
        icon: Icons.User,
        bgColor: "#a21caf"
    },
    education: {
        label: "Educación",
        value: "education",
        icon: Icons.BookOpen,
        bgColor: "#047857"
    },
    others: {
        label: "Otros",
        value: "others",
        icon: Icons.DotsThreeOutline,
        bgColor: "#525252"
    },
};

export const incomeCategory: CategoryType = {
    label: "Ingresos",
    value: "income",
    icon: Icons.CurrencyDollarSimple,
    bgColor: "#16A34A"
};

export const transactionTypes = [
    {label: "Gastos", value: "expense"},
    {label: "Ingresos", value: "income"}
];