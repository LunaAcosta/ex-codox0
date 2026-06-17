export const getLast7Days = () => {
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();

        date.setDate(date.getDate() - i);

        result.push({
            day: dayOfWeek[date.getDay()],
            date: date.toISOString().split("T")[0],
            income: 0,
            expense: 0
        });
    }

    return result;
}

export const getLast12Months = () => {
    const monthsOfYear = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const result = [];

    for (let i = 11; i >= 0; i--) {
        const date = new Date();

        date.setMonth(date.getMonth() - i);

        const monthName = monthsOfYear[date.getMonth()];
        const shortYear = date.getFullYear().toString().slice(-2);

        result.push({
            month: `${monthName} ${shortYear}`,
            fullDate: date.toISOString().split("T")[0],
            income: 0,
            expense: 0
        });
    }

    return result;
}

export const getYearRange = (
    startYear: number,
    endYear: number
) => {
    const result = [];

    for (let year = startYear; year <= endYear; year++) {
        result.push({
            year: year.toString(),
            fullDate: `01-01-${year}`,
            income: 0,
            expense: 0
        });
    }
    return result;
};