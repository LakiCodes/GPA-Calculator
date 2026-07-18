import { commonFirstYear, courseKey, makeCourse, makeElectiveGroup, makeProgramme } from "./curriculumFactory";
const make = (programmeId) => ({
    c: (seed) => makeCourse(programmeId, seed),
    g: (seed) => makeElectiveGroup(programmeId, seed)
});
const accounting = () => {
    const programmeId = "accounting";
    const { c, g } = make(programmeId);
    const groups = [
        g({
            id: "acc-y3s2-elective",
            title: "Year III Semester II accounting elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 2,
            courses: [
                ["ACC 3378", "Forensic Accounting"],
                ["ACC 3379", "Advanced Taxation and Tax Planning"],
                ["FIN 3376", "International Financial Management"],
                ["FIN 3377", "Bank Management"],
                ["ITC 3377", "Digital Business Management and Enterprise Applications"],
                ["LAW 3372", "International Trade and Investment Law"],
                ["ENT 3383", "Entrepreneurship and Business Development"]
            ].map(([code, title]) => ({
                code,
                title,
                credits: 3,
                notionalHours: 150,
                sourcePage: "20",
                sourceTable: "Table 2.1.2"
            }))
        }),
        g({
            id: "acc-y4s2-elective-option-i",
            title: "Year IV Semester II elective for Research Report option",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 4,
            semester: 2,
            applicablePathways: ["research-report"],
            courses: [
                ["ACC 4378", "Advanced Auditing and Assurance Services"],
                ["ACC 4379", "Public Sector Accounting and Finance"],
                ["ACC 4380", "Blockchain in Accounting"],
                ["FIN 4378", "Contemporary Issues in Finance"],
                ["FIN 4379", "Entrepreneurial Finance"],
                ["LAW 4372", "Commercial Administrative Law"],
                ["LAW 4373", "Information and Communications Technology Law"],
                ["ENT 4378", "Managing Creativity and Innovation"]
            ].map(([code, title]) => ({
                code,
                title,
                credits: 3,
                notionalHours: 150,
                sourcePage: "20",
                sourceTable: "Table 2.1.2"
            }))
        })
    ];
    const courses = [
        ...commonFirstYear(programmeId),
        c({ code: "ACC 2370", title: "Management Accounting", credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "BEC 2370", title: "Macroeconomics", credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "DSC 2370", title: "Operations Management", credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "FIN 2370", title: "Financial Management", credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "MAR 2370", title: "Marketing Management", credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 2373", title: "Advanced Financial Accounting and Reporting", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 2276", title: "Computerized Accounting", credits: 2, notionalHours: 100, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 2272", title: "Personal and Professional Development", credits: 2, notionalHours: 50, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1", deliveryType: "annual", assessedAnnually: true, notes: ["Continued across Year II semesters and credited once in Semester II."] }),
        c({ code: "ACC 2475", title: "Accounting Information Systems and ERP Applications", credits: 4, notionalHours: 100, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1", deliveryType: "annual", assessedAnnually: true, notes: ["Continued across Year II semesters and credited once in Semester II."] }),
        c({ code: "BUS 2371", title: "Organizational Behaviour", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "FIN 2372", title: "Advanced Corporate Finance", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "LAW 2372", title: "Business and Corporate Law", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3270", title: "Accounting and Financial Modeling", credits: 2, notionalHours: 100, year: 3, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3371", title: "Advanced Management Accounting", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3372", title: "Auditing and Assurance Services", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3373", title: "Corporate Reporting", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3374", title: "Taxation", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "18", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3376", title: "Artificial Intelligence and Data Analytics in Accounting", credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3377", title: "Corporate Sustainability Accounting", credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 3475", title: "Internship in Accounting and Finance I", credits: 4, notionalHours: 300, year: 3, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1", deliveryType: "annual", assessedAnnually: true, notes: ["Notional hours spread across Year III semesters."] }),
        c({ code: "FIN 3375", title: "Investment and Portfolio Management", credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4370", title: "Governance, Ethics and Risk Management", credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4371", title: "Accounting Theory and Contemporary Issues", credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4372", title: "Research Methodology and Proposal Writing", credits: 3, notionalHours: 300, year: 4, semester: 1, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "BUS 4370", title: "Strategic Management", credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4374", title: "Strategic Management Accounting", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4375", title: "Business Analysis and Valuation", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1" }),
        c({ code: "ACC 4673", title: "Internship in Accounting and Finance II", credits: 6, notionalHours: 450, year: 4, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1", deliveryType: "annual", assessedAnnually: true, notes: ["Notional hours spread across Year IV semesters."] }),
        c({ code: "ACC 4376", title: "Research Report", credits: 3, notionalHours: 300, year: 4, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1", pathwayIds: ["research-report"] }),
        c({ code: "ACC 4677", title: "Dissertation", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "19", sourceTable: "Table 2.1.1", pathwayIds: ["dissertation"] })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Accounting",
        shortName: "Accounting",
        department: "Accounting",
        programmeSourcePages: ["16-20"],
        pathways: [
            { id: "research-report", title: "Option I - Research Report plus elective", shortTitle: "Research Report", sourcePage: "19" },
            { id: "dissertation", title: "Option II - Dissertation", shortTitle: "Dissertation", sourcePage: "19" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: {
                [courseKey(1, 1)]: 16,
                [courseKey(1, 2)]: 15,
                [courseKey(2, 1)]: 15,
                [courseKey(2, 2)]: 20,
                [courseKey(3, 1)]: 14,
                [courseKey(3, 2)]: 16,
                [courseKey(4, 1)]: 12,
                [courseKey(4, 2)]: 18
            },
            yearCredits: { Y1: 31, Y2: 35, Y3: 30, Y4: 30 },
            programmeCredits: 126
        }
    });
};
const businessAdministration = () => {
    const programmeId = "business-administration";
    const { c, g } = make(programmeId);
    const groups = [
        g({
            id: "bus-y3s2-elective",
            title: "Year III Semester II management elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 2,
            courses: [
                ["BUS 3382", "Leadership and Cross-Cultural Management"],
                ["ACC 3376", "Artificial Intelligence and Data Analytics in Accounting"],
                ["ACC 3381", "Taxation"],
                ["BEC 3374", "Project Management"],
                ["ENT 3383", "Entrepreneurship and Business Development"],
                ["HRM 3376", "Human Resource Information Systems"],
                ["ITC 3377", "Digital Business Management and Enterprise Applications"],
                ["FIN 3375", "Investment and Portfolio Management"],
                ["FIN 3377", "Bank Management"],
                ["FIN 3376", "International Financial Management"],
                ["MAR 3386", "Hospitality and Tourism Marketing"],
                ["DSC 3380", "International Logistics Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "40", sourceTable: "Table 2.2.4" }))
        }),
        g({
            id: "bus-y4s1-applied-alternative",
            title: "Pathway Two applied component I",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 4,
            semester: 1,
            applicablePathways: ["applied-management"],
            notes: ["Choose either internship in management or business development continuation."],
            courses: [
                { code: "BUS 4372", title: "Business Management Internship", credits: 3, notionalHours: 300, sourcePage: "40", sourceTable: "Table 2.2.3" },
                { code: "BUS 4377", title: "Business Development: Formation and Implementation I", credits: 3, notionalHours: 300, sourcePage: "40", sourceTable: "Table 2.2.3" }
            ]
        }),
        g({
            id: "bus-y4s1-elective",
            title: "Pathway Two Year IV Semester I elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 4,
            semester: 1,
            applicablePathways: ["applied-management"],
            courses: [
                ["BUS 4374", "Sustainability and Environmental Management"],
                ["HRM 4374", "Human Resource Development"],
                ["DSC 4370", "Service Management"],
                ["ITC 4381", "Artificial Intelligence for Business"],
                ["DSC 4376", "Data Analysis for Managers"],
                ["BEC 4370", "Development Economics"],
                ["FIN 4372", "Financial Risk Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "41", sourceTable: "Table 2.2.5" }))
        }),
        g({
            id: "bus-y4s2-applied-alternative",
            title: "Pathway Year IV Semester II internship/business development alternative",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 6,
            year: 4,
            semester: 2,
            courses: [
                { code: "BUS 4671", title: "Internship in Management", credits: 6, notionalHours: 600, sourcePage: "40", sourceTable: "Table 2.2.3" },
                { code: "BUS 4672", title: "Business Development: Formation and Implementation II", credits: 6, notionalHours: 600, sourcePage: "40", sourceTable: "Table 2.2.3" }
            ]
        }),
        g({
            id: "bus-y4s2-elective",
            title: "Pathway One Year IV Semester II elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 4,
            semester: 2,
            applicablePathways: ["research-dissertation"],
            courses: [
                ["BUS 4382", "Reflective Research Writing and Dissemination"],
                ["BUS 4383", "Critical Approaches to Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "41", sourceTable: "Table 2.2.6" }))
        })
    ];
    const courses = [
        ...commonFirstYear(programmeId),
        c({ code: "BUS 2274", title: "Managing Personal and Managerial Competencies", credits: 2, notionalHours: 100, year: 2, semester: 1, sourcePage: "39", sourceTable: "Table 2.2.3" }),
        ...["BEC 2370|Macroeconomics", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "ACC 2370|Management Accounting", "DSC 2370|Operations Management"].map((row) => {
            const [code, title] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 2, semester: 1, sourcePage: "39", sourceTable: "Table 2.2.3" });
        }),
        ...["DSC 2371|Supply Chain Management", "BUS 2372|Business in Society", "BUS 2373|Business Psychology", "LAW 2374|Business Law", "ITC 2372|Business Analytics"].map((row) => {
            const [code, title] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "39", sourceTable: "Table 2.2.3" });
        }),
        ...["BUS 3370|Organisational Behaviour", "BUS 3371|Business Innovation", "LAW 3370|New Dimensions in Business Law", "ITC 3371|Management Information Systems and ERP Applications", "DSC 3370|Operations Research"].map((row) => {
            const [code, title] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "39", sourceTable: "Table 2.2.3" });
        }),
        c({ code: "BUS 3280", title: "Managing for Productivity and Quality", credits: 2, notionalHours: 100, year: 3, semester: 1, sourcePage: "39", sourceTable: "Table 2.2.3" }),
        ...["BUS 3373|Business Ethics and Corporate Social Responsibility", "BUS 3374|Contemporary Issues in Management", "BUS 3375|Knowledge Management", "BUS 3381|Organisational Change and Development"].map((row) => {
            const [code, title] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "39", sourceTable: "Table 2.2.3" });
        }),
        c({ code: "BUS 3377", title: "Research Methodology", credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "39", sourceTable: "Table 2.2.3", pathwayIds: ["research-dissertation"] }),
        ...["BUS 4378|International Business Management", "BUS 4370|Strategic Management"].map((row) => {
            const [code, title] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "40", sourceTable: "Table 2.2.3" });
        }),
        c({ code: "BUS 4879", title: "Dissertation", credits: 8, notionalHours: 800, year: 4, semester: 1, sourcePage: "40", sourceTable: "Table 2.2.3", pathwayIds: ["research-dissertation"] }),
        c({ code: "BUS 4380", title: "Research Methods in Management", credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "40", sourceTable: "Table 2.2.3", pathwayIds: ["applied-management"] }),
        c({ code: "BUS 4581", title: "Research Project in Management", credits: 5, notionalHours: 500, year: 4, semester: 2, sourcePage: "40", sourceTable: "Table 2.2.3", pathwayIds: ["applied-management"] })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Business Administration",
        shortName: "Business Administration",
        department: "Business Administration",
        programmeSourcePages: ["35-41"],
        pathways: [
            { id: "research-dissertation", title: "Pathway ONE - Dissertation", shortTitle: "Pathway I", sourcePage: "39-40" },
            { id: "applied-management", title: "Pathway TWO - Applied management project", shortTitle: "Pathway II", sourcePage: "39-40" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: {
                Y1S1: 16,
                Y1S2: 15,
                Y2S1: 17,
                Y2S2: 15,
                Y3S1: 17,
                "Y3S2:research-dissertation": 18,
                "Y3S2:applied-management": 15,
                "Y4S1:research-dissertation": 14,
                "Y4S1:applied-management": 15,
                "Y4S2:research-dissertation": 9,
                "Y4S2:applied-management": 11
            },
            yearCredits: {
                Y1: 31,
                Y2: 32,
                "Y3:research-dissertation": 35,
                "Y3:applied-management": 32,
                "Y4:research-dissertation": 23,
                "Y4:applied-management": 26
            },
            programmeCredits: 121
        }
    });
};
const businessEconomics = () => {
    const programmeId = "business-economics";
    const { c, g } = make(programmeId);
    const groups = [
        g({
            id: "bec-y2s2-elective",
            title: "Year II Semester II Business Economics elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 2,
            semester: 2,
            courses: [
                ["FIN 2372", "Advanced Corporate Finance"],
                ["DSC 2371", "Supply Chain Management"],
                ["ENT 2375", "Entrepreneurship"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "57", sourceTable: "Table 2.3.1" }))
        }),
        g({
            id: "bec-y3s1-bnk-elective",
            title: "BNK Year III Semester I elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 1,
            applicablePathways: ["bnk"],
            courses: [
                ["FIN 3371", "Business Valuation Theory and Applications"],
                ["FIN 3372", "Credit and Treasury Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "58", sourceTable: "Table 2.3.1" }))
        }),
        g({
            id: "bec-y3s2-bnk-elective",
            title: "BNK Year III Semester II elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 2,
            applicablePathways: ["bnk"],
            courses: [
                ["FIN 3375", "Investment and Portfolio Management"],
                ["FIN 3373", "Financial Modelling and Forecasting"],
                ["FIN 3377", "Bank Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "58", sourceTable: "Table 2.3.1" }))
        }),
        g({
            id: "bec-y3s2-ds-elective",
            title: "DS Year III Semester II elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 2,
            applicablePathways: ["ds"],
            courses: [
                ["LAW 3374", "Labour Law and Industrial Relations"],
                ["BEC 3377", "Financial Economics"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "58", sourceTable: "Table 2.3.1" }))
        }),
        g({
            id: "bec-y3s2-ieb-elective",
            title: "IEB Year III Semester II elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 3,
            semester: 2,
            applicablePathways: ["ieb"],
            courses: [
                ["BEC 3377", "Financial Economics"],
                ["DSC 3379", "International Procurement and Supply Chain Management"]
            ].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "58", sourceTable: "Table 2.3.1" }))
        }),
        g({
            id: "bec-y4s1-path-elective",
            title: "Year IV Semester I study-area elective",
            requiredSelectionCount: 1,
            minimumSelectionCount: 1,
            maximumSelectionCount: 1,
            requiredCredits: 3,
            year: 4,
            semester: 1,
            notes: ["Available choices are filtered by the selected study area."],
            courses: [
                { code: "FIN 4372", title: "Financial Risk Management", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["bnk"] },
                { code: "FIN 4374", title: "Insurance and Actuarial Finance", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["bnk"] },
                { code: "BEC 4377", title: "Industrial Training", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["bnk", "ds", "ieb", "dse"] },
                { code: "BEC 4373", title: "Environmental Economics", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["ds"] },
                { code: "LAW 4370", title: "International Trade and Investment Law", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["ieb"] },
                { code: "BEC 4380", title: "Behavioural Economics", credits: 3, notionalHours: 150, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["dse"] }
            ]
        })
    ];
    const commonRows = (year, semester, rows, sourcePage) => rows.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.3.1" });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...commonRows(2, 1, ["BEC 2370|Macroeconomics", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "DSC 2370|Operations Management", "ACC 2370|Management Accounting"], "57"),
        ...commonRows(2, 2, ["BEC 2371|Advanced Economics", "BUS 2371|Organisational Behaviour", "ITC 2372|Business Analytics", "BEC 2372|Mathematical Economics"], "57"),
        c({ code: "BEC 2276", title: "English for Business Economics Part I", credits: 2, notionalHours: 100, year: 2, semester: 2, sourcePage: "57", sourceTable: "Table 2.3.1", deliveryType: "annual", assessedAnnually: true }),
        ...commonRows(3, 1, ["BEC 3370|Managerial Economics", "BEC 3371|Econometrics", "DSC 3370|Operations Research", "ITC 3371|Management Information Systems and ERP Applications"], "58"),
        c({ code: "BEC 3372", title: "International Economic Relations", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: ["ds"] }),
        c({ code: "BEC 3373", title: "International Investment and Finance", credits: 3, notionalHours: 150, year: 3, semester: 1, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: ["ieb"] }),
        c({ code: "ITC 3286", title: "Programming in Python", credits: 2, notionalHours: 100, year: 3, semester: 1, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: ["dse"] }),
        c({ code: "BEC 3281", title: "Computational Economics", credits: 2, notionalHours: 100, year: 3, semester: 1, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: ["dse"] }),
        ...commonRows(3, 2, ["BEC 3374|Project Management", "BEC 3375|Monetary Economics"], "58"),
        c({ code: "BEC 3180", title: "Personal and Professional Development", credits: 1, notionalHours: 50, year: 3, semester: 2, sourcePage: "58", sourceTable: "Table 2.3.1", deliveryType: "annual", assessedAnnually: true }),
        c({ code: "BCC 3273", title: "English for Business Economics Part II", credits: 2, notionalHours: 100, year: 3, semester: 2, sourcePage: "58", sourceTable: "Table 2.3.1", deliveryType: "annual", assessedAnnually: true }),
        ...["BEC 3376|Commercial Banking|bnk", "BEC 3377|Financial Economics|bnk", "BEC 3378|Economics of Innovation|ds", "BEC 3379|Labour Economics|ds", "DSC 3380|International Logistic Management|ieb", "FIN 3376|International Financial Management|ieb"].map((row) => {
            const [code, title, path] = row.split("|");
            return c({ code, title, credits: 3, notionalHours: 150, year: 3, semester: 2, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: [path] });
        }),
        ...["BEC 3282|Economic Data Visualization|2|100", "BEC 3383|Big Data Analytics for Economics|3|150", "ITC 3287|AI for Business|2|100", "BEC 3284|Advanced Econometrics|2|100"].map((row) => {
            const [code, title, credits, hours] = row.split("|");
            return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year: 3, semester: 2, sourcePage: "58", sourceTable: "Table 2.3.1", pathwayIds: ["dse"] });
        }),
        ...commonRows(4, 1, ["BEC 4370|Development Economics", "BUS 4370|Strategic Management", "BEC 4371|Research Methodology", "BEC 4372|International Trade and Payments"], "59"),
        c({ code: "BEC 4375", title: "Money and Banking", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["bnk"] }),
        c({ code: "BEC 4376", title: "Contemporary Issues in Global Economy", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["ds", "ieb"] }),
        c({ code: "BEC 4281", title: "Contemporary Economics and Digitalisation", credits: 2, notionalHours: 100, year: 4, semester: 2, sourcePage: "59", sourceTable: "Table 2.3.1", pathwayIds: ["dse"] }),
        c({ code: "BEC 4678", title: "Internship Training", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "59", sourceTable: "Table 2.3.1" }),
        c({ code: "BEC 4679", title: "Independent Study in Business Economics", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "59", sourceTable: "Table 2.3.1" })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Business Economics",
        shortName: "Business Economics",
        department: "Business Economics",
        programmeSourcePages: ["53-59"],
        pathways: [
            { id: "bnk", title: "Banking", shortTitle: "BNK", sourcePage: "55" },
            { id: "ds", title: "Development Studies", shortTitle: "DS", sourcePage: "55" },
            { id: "ieb", title: "International Economics and Business", shortTitle: "IEB", sourcePage: "56" },
            { id: "dse", title: "Data Science for Economics", shortTitle: "DSE", sourcePage: "56" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: {
                Y1S1: 16,
                Y1S2: 15,
                Y2S1: 15,
                Y2S2: 17,
                Y3S1: { min: 15, max: 16 },
                Y3S2: 18,
                Y4S1: 15,
                Y4S2: { min: 14, max: 15 }
            },
            yearCredits: { Y1: 31, Y2: 32, Y3: { min: 33, max: 34 }, Y4: { min: 29, max: 30 } },
            programmeCredits: 126,
            notes: ["Printed table provides ranges for Years III and IV because DSE has different credit distribution."]
        }
    });
};
const bcom = () => {
    const programmeId = "bcom";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "com-y3s1-elective", title: "Year III Semester I commerce elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 1, courses: [["COM 3373", "Sustainable Commerce"], ["DSC 3374", "Service Management"], ["HRM 3371", "Employee Safety and Health Management"], ["LAW 3371", "Commercial Administrative Law"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "74", sourceTable: "Table 2.4.1" })) }),
        g({ id: "com-y3s2-elective", title: "Year III Semester II commerce elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 2, courses: [["DSC 3376", "Logistics and Transportation Management"], ["ITC 3377", "Digital Business Management and Enterprise Applications"], ["MAR 3386", "Hospitality and Tourism Marketing"], ["MAR 3388", "International Marketing"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "74", sourceTable: "Table 2.4.1" })) }),
        g({ id: "com-y4s1-elective", title: "Year IV Semester I commerce elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 1, courses: [["COM 4374", "Financial Investigation and Forensic Accounting"], ["COM 4375", "Project Management"], ["FIN 4374", "Insurance and Actuarial Finance"], ["MAR 4375", "Entrepreneurial Marketing and Marketing Innovations"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "75", sourceTable: "Table 2.4.1" })) })
    ];
    const rows = (year, semester, sourcePage, values, pathwayIds) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.4.1", pathwayIds });
    });
    const courses = [
        ...commonFirstYear(programmeId, "bcom"),
        ...rows(2, 1, "74", ["COM 2370|Macroeconomics", "COM 2371|Cost and Management Accounting", "COM 2372|Computerized Accounting Systems", "DSC 2370|Operations Management", "FIN 2370|Financial Management", "MAR 2370|Marketing Management"]),
        ...rows(2, 2, "74", ["COM 2373|Theory and Practice of Banking", "COM 2374|Theory and Practice of Trade", "COM 2375|Auditing and Assurance", "BUS 2371|Organisational Behaviour", "LAW 2372|Business and Corporate Law", "COM 2176|Managerial Skills Development II|1|50"]),
        ...rows(3, 1, "74", ["COM 3370|International Trade and Economic Relations", "COM 3371|Taxation", "COM 3372|Management Science", "ITC 3371|Management Information Systems and ERP Applications"]),
        ...rows(3, 2, "74", ["COM 3374|Research Methodology", "COM 3375|Development Economics", "COM 3376|Advanced Financial Accounting and Reporting", "DSC 3381|Supply Chain Management", "COM 3177|Managerial Skills Development III|1|50"]),
        ...rows(4, 1, "75", ["COM 4370|International Accounting", "COM 4371|Financing of International Trade", "BUS 4370|Strategic Management", "LAW 4370|International Trade and Investment Law"]),
        c({ code: "COM 4672", title: "Internship", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "75", sourceTable: "Table 2.4.1", deliveryType: "annual", assessedAnnually: true, pathwayIds: ["standard-internship"] }),
        c({ code: "COM 4673", title: "Dissertation", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "75", sourceTable: "Table 2.4.1", deliveryType: "annual", assessedAnnually: true }),
        ...rows(4, 2, "75", ["COM 4376|Contemporary Issues in Commerce", "HRM 4375|Personal Quality Development"], ["internship-alternative"])
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BCom Honours",
        shortName: "BCom",
        department: "Commerce",
        programmeSourcePages: ["71-75"],
        pathways: [
            { id: "standard-internship", title: "Standard internship", shortTitle: "Internship", sourcePage: "75" },
            { id: "internship-alternative", title: "Internship alternative for eligible students", shortTitle: "Alternative", sourcePage: "75" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 17, Y1S2: 15, Y2S1: 18, Y2S2: 16, Y3S1: 15, Y3S2: 16, Y4S1: 15, Y4S2: 12 },
            yearCredits: { Y1: 32, Y2: 34, Y3: 31, Y4: 27 },
            programmeCredits: 124
        }
    });
};
const operationsTechnology = () => {
    const programmeId = "operations-technology-management";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "otm-y3s1-elective", title: "Year III Semester I OTM elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 1, courses: [["DSC 3373", "Project Management"], ["HRM 3371", "Employee Safety and Health Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "90", sourceTable: "Table 2.5.1" })) }),
        g({ id: "otm-y4s1-elective", title: "Year IV Semester I OTM elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 1, year: 4, semester: 1, courses: [["DSC 4173", "Business Forecasting"], ["DSC 4174", "Business Intelligence Management"], ["DSC 4175", "Data Analysis Methods in Research"]].map(([code, title]) => ({ code, title, credits: 1, notionalHours: 50, sourcePage: "90", sourceTable: "Table 2.5.1" })) })
    ];
    const rows = (year, semester, sourcePage, values, pathwayIds) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.5.1", pathwayIds });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...rows(2, 1, "89", ["DSC 2370|Operations Management", "BEC 2370|Macroeconomics", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "ACC 2370|Management Accounting", "BCC 2270|Practical Communication for Operations Management|2|100"]),
        ...rows(2, 2, "90", ["DSC 2371|Supply Chain Management", "DSC 2372|Technology Management", "ITC 2372|Business Analytics", "ENT 2375|Entrepreneurship", "BUS 2371|Organisational Behaviour", "BCC 2175|Effective Writing for Academic Purposes|1|50"]),
        ...rows(3, 1, "90", ["DSC 3370|Operations Research", "DSC 3371|Data Analysis for Managers", "DSC 3372|Quality Management", "BEC 3370|Managerial Economics", "ITC 3371|Management Information Systems and ERP Applications"]),
        ...rows(3, 2, "90", ["DSC 3375|Research Methodology for Operations Management", "DSC 3376|Logistics and Transportation Management", "DSC 3377|Advanced Operations Research", "DSC 3378|Operations System Design and Management", "BUS 3379|International Business Management", "ITC 3377|Digital Business Management and Enterprise Applications"]),
        ...rows(4, 1, "90", ["DSC 4370|Service Management", "DSC 4371|Operation Planning and Control", "DSC 4272|Personality and Skill Development|2|100", "BUS 4370|Strategic Management"]),
        c({ code: "DSC 4677", title: "Research Study in Operations Management", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "90", sourceTable: "Table 2.5.1", pathwayIds: ["research-study"] }),
        c({ code: "DSC 4678", title: "Research Project in Operations Management", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "90", sourceTable: "Table 2.5.1", pathwayIds: ["research-project"] }),
        c({ code: "DSC 4679", title: "Internship", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "90", sourceTable: "Table 2.5.1", notes: ["Included for both Year IV Semester II options to satisfy the printed 12-credit total."] })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Operations and Technology Management",
        shortName: "Operations and Technology",
        department: "Decision Sciences",
        programmeSourcePages: ["85-90"],
        pathways: [
            { id: "research-study", title: "Option 1 - Research Study", shortTitle: "Research Study", sourcePage: "90" },
            { id: "research-project", title: "Option 2 - Research Project", shortTitle: "Research Project", sourcePage: "90" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 15, Y2S1: 17, Y2S2: 16, Y3S1: 18, Y3S2: 18, Y4S1: 12, Y4S2: 12 },
            yearCredits: { Y1: 31, Y2: 33, Y3: 36, Y4: 24 },
            programmeCredits: 124,
            notes: ["Printed programme text states 124 credits; Year IV Semester II Option 1 is interpreted with internship to match the 12-credit semester total."]
        }
    });
};
const entrepreneurship = () => {
    const programmeId = "entrepreneurship";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "ent-y3s1-cor-electives", title: "Corporate Entrepreneurship Year III Semester I electives", requiredSelectionCount: 2, minimumSelectionCount: 2, maximumSelectionCount: 2, requiredCredits: 6, year: 3, semester: 1, applicablePathways: ["corporate-entrepreneurship"], courses: [["ENT 3371", "Professional Skills Development I"], ["ACC 3372", "Auditing and Assurance Services"], ["MAR 3376", "Agriculture and Food Marketing"], ["ITC 3374", "Information Technology Project Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "103", sourceTable: "Table 2.6.1" })) }),
        g({ id: "ent-y3s2-cor-electives", title: "Corporate Entrepreneurship Year III Semester II electives", requiredSelectionCount: 2, minimumSelectionCount: 2, maximumSelectionCount: 2, requiredCredits: 6, year: 3, semester: 2, applicablePathways: ["corporate-entrepreneurship"], courses: [["DSC 3381", "Supply Chain Management"], ["ITC 3377", "Digital Business Management and Enterprise Applications"], ["ACC 3381", "Taxation"], ["ACC 3377", "Corporate Sustainability Accounting"], ["BEC 3374", "Project Management"], ["FIN 3379", "Entrepreneurial Finance"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "103", sourceTable: "Table 2.6.1" })) }),
        g({ id: "ent-y4s1-cor-electives", title: "Corporate Entrepreneurship Year IV Semester I electives", requiredSelectionCount: 2, minimumSelectionCount: 2, maximumSelectionCount: 2, requiredCredits: 6, year: 4, semester: 1, applicablePathways: ["corporate-entrepreneurship"], courses: [["ENT 4372", "Professional Skills Development II"], ["ENT 4373", "Sustainable Entrepreneurship"], ["BEC 4370", "Development Economics"], ["FIN 4375", "Corporate Documentation and Reporting"], ["ITC 4373", "Advanced Enterprise Resource Planning Systems"], ["ACC 4370", "Governance, Ethics and Risk Management"], ["MAR 4376", "Customer Relationship Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "103", sourceTable: "Table 2.6.1" })) })
    ];
    const rows = (year, semester, sourcePage, values, pathwayIds) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.6.1", pathwayIds });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...rows(2, 1, "102", ["BEC 2370|Macroeconomics", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "DSC 2370|Operations Management", "ENT 2370|Entrepreneurship and SMEs", "ACC 2370|Management Accounting", "BCC 2272|Effective Communication for Entrepreneurs|2|100"]),
        ...rows(2, 2, "102", ["ENT 2371|Managing Creativity and Innovation", "ENT 2372|New Venture Creation", "ENT 2373|Intelligence and Belief Management", "BUS 2371|Organizational Behavior", "LAW 2376|Legal Aspects of Entrepreneurship"]),
        c({ code: "ITC 2372", title: "Business Analytics", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "102", sourceTable: "Table 2.6.1", pathwayIds: ["business-entrepreneurship"] }),
        c({ code: "ENT 2376", title: "Corporate Entrepreneurship", credits: 3, notionalHours: 150, year: 2, semester: 2, sourcePage: "102", sourceTable: "Table 2.6.1", pathwayIds: ["corporate-entrepreneurship"] }),
        ...rows(3, 1, "103", ["ENT 3370|Fundamentals in Business Planning", "DSC 3371|Data Analysis for Managers", "ITC 3371|Management Information Systems and ERP Applications", "BEC 3370|Managerial Economics"]),
        ...rows(3, 1, "103", ["ENT 3371|Professional Skills Development I", "ENT 3373|Business Development Seminars I"], ["business-entrepreneurship"]),
        ...rows(3, 2, "103", ["ENT 3375|Managing Entrepreneurial Growth", "ENT 3377|Research Methodology", "ENT 3378|Global Business Management", "BCC 3372|Academic Writing"]),
        ...rows(3, 2, "103", ["ENT 3374|Business Plan Development", "ENT 3382|Business Development Seminars II"], ["business-entrepreneurship"]),
        ...rows(4, 1, "103", ["ENT 4370|Contemporary Issues in Entrepreneurship", "ENT 4271|Research Study I|2|200", "BUS 4370|Strategic Management"]),
        ...rows(4, 1, "103", ["ENT 4372|Professional Skills Development II", "BEC 4370|Development Economics"], ["business-entrepreneurship"]),
        c({ code: "ENT 4475", title: "Research Study II", credits: 4, notionalHours: 400, year: 4, semester: 2, sourcePage: "103", sourceTable: "Table 2.6.1" }),
        c({ code: "ENT 4673", title: "Business Start-up and Development Project", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "103", sourceTable: "Table 2.6.1", pathwayIds: ["business-entrepreneurship"] }),
        c({ code: "ENT 4674", title: "Internship in Entrepreneurship", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "103", sourceTable: "Table 2.6.1", pathwayIds: ["corporate-entrepreneurship"] })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Entrepreneurship",
        shortName: "Entrepreneurship",
        department: "Entrepreneurship",
        programmeSourcePages: ["99-103"],
        pathways: [
            { id: "business-entrepreneurship", title: "Business Entrepreneurship", shortTitle: "BUS ENT", sourcePage: "102" },
            { id: "corporate-entrepreneurship", title: "Corporate Entrepreneurship", shortTitle: "COR ENT", sourcePage: "102" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 15, Y2S1: 20, Y2S2: 18, Y3S1: 18, Y3S2: 18, Y4S1: 14, Y4S2: 10 },
            yearCredits: { Y1: 31, Y2: 38, Y3: 36, Y4: 24 },
            programmeCredits: 129
        }
    });
};
const realEstate = () => {
    const programmeId = "real-estate-management-valuation";
    const { c, g } = make(programmeId);
    const group = g({ id: "emv-y4s1-elective", title: "Year IV Semester I real estate elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 2, year: 4, semester: 1, notes: ["Prospectus notes that at least 10 students are required for an elective to be offered."], courses: [["EMV 4287", "Business Valuation"], ["EMV 4288", "Environmental Valuation"], ["EMV 4289", "Housing and Settlement Planning"], ["EMV 4290", "Disaster Response Planning"], ["EMV 4291", "Corporate Property and Assets Management"], ["EMV 4292", "Property Technology and Digital Solutions"], ["EMV 4293", "Advanced Geographic Information Systems and Applications"], ["EMV 4294", "Land Management"]].map(([code, title]) => ({ code, title, credits: 2, notionalHours: 100, sourcePage: "119", sourceTable: "Table 01" })) });
    const rows = (year, semester, sourcePage, values) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.7.1" });
    });
    const courses = [
        ...commonFirstYear(programmeId, "emv"),
        ...rows(2, 1, "118", ["EMV 2271|Building Construction|2|100", "EMV 2283|Property Drawing and Documentation|2|200", "BEC 2370|Macroeconomics", "EMV 2386|Land Economics", "FIN 2370|Financial Management", "LAW 2270|Law of Contract and Delict|2|100"]),
        ...rows(2, 2, "118", ["EMV 2377|Principles of Valuation", "EMV 2379|Geographic Information Systems|3|300", "EMV 2280|Institutional Framework for Real Estate|2|100", "EMV 2282|Environment and Sustainable Real Estate|2|100", "EMV 2384|Surveying and Levelling|3|300", "EMV 2285|Building Pathology|2|200", "EMV 2387|Building Cost Estimation"]),
        ...rows(3, 1, "118", ["EMV 3370|Property Law", "EMV 3272|Real Estate Market Analysis|2|100", "EMV 3373|Urban and Regional Planning I", "EMV 3382|Advanced Valuation", "EMV 3183|Non-Statutory Valuation Report|1|100", "EMV 3386|Real Estate Development and Management"]),
        ...rows(3, 2, "118", ["EMV 3376|Real Estate Investment Analysis", "EMV 3281|Construction Project Management|2|100", "EMV 3284|Agricultural Valuation|2|100", "EMV 3185|Agricultural Valuation Report|1|100", "EMV 3287|Applied Valuation I|2|100", "EMV 3188|Asset Valuation Report for Financial Statements|1|100", "EMV 3389|Urban and Regional Planning II and Studio Work|3|300"]),
        ...rows(4, 1, "118", ["EMV 4270|Research Methodology|2|100", "EMV 4271|Contemporary Developments in Real Estate|2|100", "EMV 4372|Urban Economics", "EMV 4385|Applied Valuation II", "EMV 4186|Statutory Valuation Report|1|100"]),
        c({ code: "EMV 4682", title: "Independent Research Study", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "119", sourceTable: "Table 2.7.1", deliveryType: "annual", assessedAnnually: true }),
        ...rows(4, 2, "119", ["EMV 4683|Internship|6|600", "EMV 4184|Ethics and Professional Development|1|100"])
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Real Estate Management and Valuation",
        shortName: "Real Estate Management and Valuation",
        department: "Estate Management and Valuation",
        programmeSourcePages: ["115-119"],
        courses,
        electiveGroups: [group],
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 16, Y2S1: 15, Y2S2: 18, Y3S1: 15, Y3S2: 14, Y4S1: 13, Y4S2: 13 },
            yearCredits: { Y1: 32, Y2: 33, Y3: 29, Y4: 26 },
            programmeCredits: 120
        }
    });
};
const finance = () => {
    const programmeId = "finance";
    const { c, g } = make(programmeId);
    const groupCourses = (sourceTable, entries) => entries.map((row) => {
        const [code, title] = row.split("|");
        return { code, title, credits: 3, notionalHours: 150, sourcePage: "137", sourceTable };
    });
    const groups = [
        g({ id: "fin-elective-1", title: "Elective 1 - Year III Semester I", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 1, courses: groupCourses("Table 2.8.1 Elective 1", ["FIN 3372|Credit and Treasury Management", "ACC 3374|Taxation", "DSC 3370|Operations Research"]) }),
        g({ id: "fin-elective-2", title: "Elective 2 - Year III Semester II", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 2, courses: groupCourses("Table 2.8.1 Elective 2", ["FIN 3380|Python for Finance", "ENT 3385|Entrepreneurship", "ACC 3376|Artificial Intelligence and Data Analytics in Accounting", "BEC 3375|Monetary Economics", "DSC 3381|Supply Chain Management", "ITC 3377|Digital Business Management and Enterprise Applications", "BEC 3374|Project Management"]) }),
        g({ id: "fin-elective-3", title: "Elective 3 - Year IV Semester I", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 1, courses: groupCourses("Table 2.8.1 Elective 3", ["FIN 4372|Financial Risk Management", "FIN 4373|Real Estate Finance", "FIN 4374|Insurance and Actuarial Finance", "FIN 4375|Corporate Documentation and Reporting", "BEC 4370|Development Economics"]) }),
        g({ id: "fin-elective-4", title: "Elective 4 - Dissertation option", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 2, applicablePathways: ["dissertation"], courses: groupCourses("Table 2.8.1 Elective 4", ["FIN 4378|Contemporary Issues in Finance", "FIN 4379|Entrepreneurial Finance", "FIN 4380|Cyber Risks, Blockchain and Investments", "FIN 4381|Financial Services and Regulations", "FIN 4383|Internship II"]) }),
        g({ id: "fin-elective-5", title: "Elective 5 - Research Project option", requiredSelectionCount: 2, minimumSelectionCount: 2, maximumSelectionCount: 2, requiredCredits: 6, year: 4, semester: 2, applicablePathways: ["research-project"], courses: groupCourses("Table 2.8.1 Elective 5", ["FIN 4378|Contemporary Issues in Finance", "FIN 4379|Entrepreneurial Finance", "FIN 4380|Cyber Risks, Blockchain and Investments", "FIN 4381|Financial Services and Regulations", "FIN 4383|Internship II"]) })
    ];
    const rows = (year, semester, sourcePage, values, pathwayIds) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.8.1", pathwayIds });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...rows(2, 1, "136", ["FIN 2370|Financial Management", "FIN 2371|Financial Mathematics", "ACC 2370|Management Accounting", "BEC 2370|Macroeconomics", "MAR 2370|Marketing Management", "DSC 2370|Operations Management"]),
        ...rows(2, 2, "136", ["FIN 2372|Advanced Corporate Finance", "BUS 2371|Organisational Behaviour", "ITC 2371|Business Analytics", "LAW 2373|Corporate Law", "FIN 2273|Professional Skills Development|2|100", "ITC 2277|Programming in Python|2|100"]),
        ...rows(3, 1, "136", ["FIN 3370|Financial Derivatives|3|100", "FIN 3371|Business Valuation Theory and Applications", "BEC 3370|Managerial Economics", "BEC 3371|Econometrics", "ITC 3371|Management Information Systems and ERP Applications"]),
        ...rows(3, 2, "136", ["FIN 3373|Financial Modeling and Forecasting", "FIN 3374|Research Methodology", "FIN 3375|Investment and Portfolio Management", "FIN 3376|International Financial Management", "FIN 3377|Bank Management"]),
        ...rows(4, 1, "136", ["FIN 4370|Financial Analysis", "FIN 4371|Internship I|3|300", "BUS 4370|Strategic Management"]),
        c({ code: "FIN 4376", title: "Corporate Governance and Business Ethics", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "137", sourceTable: "Table 2.8.1" }),
        c({ code: "FIN 4677", title: "Dissertation", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "137", sourceTable: "Table 2.8.1", pathwayIds: ["dissertation"] }),
        c({ code: "FIN 4382", title: "Research Project", credits: 3, notionalHours: 300, year: 4, semester: 2, sourcePage: "137", sourceTable: "Table 2.8.1", pathwayIds: ["research-project"] })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Finance",
        shortName: "Finance",
        department: "Finance",
        programmeSourcePages: ["132-137"],
        pathways: [
            { id: "dissertation", title: "Option 1 - Dissertation", shortTitle: "Dissertation", sourcePage: "137" },
            { id: "research-project", title: "Option 2 - Research Project with two electives", shortTitle: "Research Project", sourcePage: "137" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 15, Y2S1: 18, Y2S2: 16, Y3S1: 18, Y3S2: 18, Y4S1: 12, Y4S2: 12 },
            yearCredits: { Y1: 31, Y2: 34, Y3: 36, Y4: 24 },
            programmeCredits: 125,
            notes: ["Programme total is computed from printed semester/year totals; the finance table does not separately print a final total in the inspected pages."]
        }
    });
};
const humanResourceManagement = () => {
    const programmeId = "human-resource-management";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "hrm-elective-list-i", title: "Elective List I", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 1, notes: ["Prospectus prints DCS 3370; interpreted as DSC 3370 Operations Research with ambiguity recorded."], courses: [["HRM 3373", "HRM: Buddhist Approaches"], ["HRM 3374", "Public Sector HRM"], ["ACC 3380", "Management Accounting"], ["BUS 3371", "Business Innovation"], ["BUS 3372", "Managing for Productivity and Quality"], ["DSC 3370", "Operations Research"], ["ITC 3371", "Management Information Systems and ERP Applications"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "151", sourceTable: "Table 2.9.1" })) }),
        g({ id: "hrm-elective-list-ii", title: "Elective List II", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 2, courses: [["HRM 3377", "High Performance Work Systems"], ["HRM 3378", "Innovation and Change for HRM"], ["HRM 3379", "HR Analytics"], ["BUS 3373", "Business Ethics and Corporate Social Responsibility"], ["BUS 3375", "Knowledge Management"], ["BUS 3376", "Leadership and Cross Cultural Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "151", sourceTable: "Table 2.9.1" })) })
    ];
    const rows = (year, semester, sourcePage, values) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.9.1" });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...rows(2, 1, "150", ["BEC 2370|Macroeconomics", "DSC 2370|Operations Management", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "HRM 2370|Human Resourcing", "BCC 2171|Professional Communication I|1|50"]),
        ...rows(2, 2, "150", ["HRM 2371|Performance Evaluation and Management", "HRM 2372|Personal Quality Development", "HRM 2270|Self and Professional Development|2|100", "BUS 2371|Organizational Behaviour", "ITC 2372|Business Analytics", "BCC 2173|Professional Communication II|1|50"]),
        ...rows(3, 1, "150", ["HRM 3370|Human Resource Development", "HRM 3371|Employee Safety and Health Management", "HRM 3372|Work Psychology and Counselling", "HRM 3270|Sustainable HRM|2|100", "BCC 3170|Professional Communication III|1|50"]),
        ...rows(3, 2, "150", ["HRM 3375|Rewards Management", "HRM 3376|Human Resource Information Systems", "BEC 3270|Economics of Labour|2|100", "LAW 3273|Labour Law|2|100", "HRM 3170|Industrial Relations|1|50", "BCC 3171|Academic Writing|1|50"]),
        ...rows(4, 1, "151", ["HRM 4370|International HRM", "HRM 4371|Contemporary Issues in HRM", "HRM 4270|Research Methodology for HRM|2|100", "BUS 4370|Strategic Management", "DSC 4175|Data Analysis Methods in Research|1|50"]),
        c({ code: "HRM 4670", title: "Internship in HRM", credits: 6, notionalHours: 300, year: 4, semester: 2, sourcePage: "151", sourceTable: "Table 2.9.1", deliveryType: "annual", assessedAnnually: true }),
        ...rows(4, 2, "151", ["HRM 4372|Advanced HRM", "HRM 4373|Sri Lankan Applications in HRM and Industrial Relations", "HRM 4671|Independent Research Study|6|600"])
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Human Resource Management",
        shortName: "Human Resource Management",
        department: "Human Resource Management",
        programmeSourcePages: ["148-151"],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 15, Y2S1: 16, Y2S2: 15, Y3S1: 15, Y3S2: 15, Y4S1: 12, Y4S2: 18 },
            yearCredits: { Y1: 31, Y2: 31, Y3: 30, Y4: 30 },
            programmeCredits: 122
        }
    });
};
const businessInformationSystems = () => {
    const programmeId = "business-information-systems";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "bis-y3s1-electives", title: "Year III Semester I BIS electives", requiredSelectionCount: 2, minimumSelectionCount: 2, maximumSelectionCount: 2, requiredCredits: 6, year: 3, semester: 1, notes: ["Prospectus line reads 'Select Three (02)'; the 19-credit semester total confirms two electives."], courses: [["ITC 3373", "Object Oriented Programming"], ["ITC 3375", "Software Engineering"], ["DSC 3371", "Data Analysis for Managers"], ["DSC 3370", "Operations Research"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "168", sourceTable: "Table 2.10.1" })) }),
        g({ id: "bis-y3s2-electives", title: "Year III Semester II BIS electives", requiredSelectionCount: 3, minimumSelectionCount: 3, maximumSelectionCount: 3, requiredCredits: 9, year: 3, semester: 2, courses: [["ITC 3389", "Information Technology Management Frameworks"], ["ITC 3380", "Programming Applications and Frameworks"], ["ITC 3381", "Software Quality Assurance"], ["ITC 3388", "User Experience Design"], ["ENT 3384", "Managing Creativity and Innovation"], ["DSC 3381", "Supply Chain Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "168", sourceTable: "Table 2.10.1" })) }),
        g({ id: "bis-y4s1-research-choice", title: "Year IV Semester I research choice", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 6, year: 4, semester: 1, courses: [["ITC 4670", "Research Study in Information Systems"], ["ITC 4671", "Information Systems Development Research Project"]].map(([code, title]) => ({ code, title, credits: 6, notionalHours: 600, sourcePage: "168", sourceTable: "Table 2.10.1" })) }),
        g({ id: "bis-y4s1-elective", title: "Year IV Semester I BIS elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 1, courses: [["ITC 4372", "Professional Ethics and ICT Law"], ["ITC 4373", "Advanced Enterprise Resource Planning Systems"], ["ITC 4374", "Virtualization and Cloud Computing"], ["ITC 4375", "Artificial Intelligence Applications"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "168", sourceTable: "Table 2.10.1" })) }),
        g({ id: "bis-y4s2-basket-i", title: "Year IV Semester II Electives Basket I", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 2, requiredCredits: 6, year: 4, semester: 2, notes: ["Select one 6-credit course or two 3-credit courses."], courses: [["ITC 4676", "Internship in Information Systems", "6", "600"], ["ITC 4682", "Technopreneurship in Information Systems", "6", "600"], ["ITC 4383", "Information Technology Product Management", "3", "150"], ["ITC 4384", "Emerging Technologies", "3", "150"]].map(([code, title, credits, hours]) => ({ code, title, credits: Number(credits), notionalHours: Number(hours), sourcePage: "168", sourceTable: "Table 2.10.1" })) }),
        g({ id: "bis-y4s2-basket-ii", title: "Year IV Semester II Electives Basket II", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 2, courses: [["ITC 4378", "Big Data Analytics"], ["ITC 4379", "Cybersecurity and Risk Management"], ["BUS 4376", "Organizational Change and Development"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "168", sourceTable: "Table 2.10.1" })) })
    ];
    const rows = (year, semester, sourcePage, values) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.10.1" });
    });
    const courses = [
        ...commonFirstYear(programmeId, "bis"),
        ...rows(2, 1, "167", ["ITC 2370|Computer Programming", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "DSC 2370|Operations Management", "BEC 2370|Macroeconomics", "ITC 2171|Personality and Skills Development (PSD) 1|1|50"]),
        ...rows(2, 2, "167", ["ITC 2372|Business Analytics", "ITC 2373|Database Design and Development", "ITC 2374|Systems Analysis and Design", "ITC 2375|Web-based Application Development", "BUS 2371|Organizational Behavior", "BCC 2174|Professional Communication|1|50", "ITC 2176|Personality and Skills Development (PSD) 2|1|50"]),
        ...rows(3, 1, "168", ["ITC 3370|Information Technology Infrastructure", "ITC 3371|Management Information Systems and ERP Applications", "ACC 3380|Management Accounting", "ITC 3172|Personality and Skills Development (PSD) 3|1|50", "ITC 3374|Information Technology Project Management"]),
        ...rows(3, 2, "168", ["ITC 3382|Information Systems Auditing and Control", "ITC 3377|Digital Business Management and Enterprise Applications", "ITC 3378|Research Methodology", "ITC 3179|Personality and Skills Development (PSD) 4|1|50"]),
        c({ code: "BUS 4370", title: "Strategic Management", credits: 3, notionalHours: 150, year: 4, semester: 1, sourcePage: "168", sourceTable: "Table 2.10.1" }),
        c({ code: "ITC 4377", title: "Business Process Management", credits: 3, notionalHours: 150, year: 4, semester: 2, sourcePage: "168", sourceTable: "Table 2.10.1" })
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Business Information Systems",
        shortName: "Business Information Systems",
        department: "Information Technology",
        programmeSourcePages: ["164-168"],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 16, Y2S1: 16, Y2S2: 17, Y3S1: 19, Y3S2: 19, Y4S1: 12, Y4S2: 12 },
            yearCredits: { Y1: 32, Y2: 33, Y3: 38, Y4: 24 },
            programmeCredits: 127
        }
    });
};
const marketingManagement = () => {
    const programmeId = "marketing-management";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "mar-y3s1-elective", title: "Year III Semester I marketing elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 2, year: 3, semester: 1, courses: [["MAR 3276", "Agriculture and Food Marketing"], ["MAR 3277", "Creative Strategy and Media Planning"], ["MAR 3278", "Marketing Metrics"], ["ITC 3284", "ERP Applications"]].map(([code, title]) => ({ code, title, credits: 2, notionalHours: 100, sourcePage: "188", sourceTable: "Table 2.11.1" })) }),
        g({ id: "mar-y3s2-elective", title: "Year III Semester II marketing elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 2, year: 3, semester: 2, courses: [["MAR 3284", "Retail and Shopper Marketing"], ["MAR 3285", "Crisis Communication"], ["MAR 3286", "Hospitality and Tourism Marketing"], ["MAR 3287", "Entertainment and Event Marketing"]].map(([code, title]) => ({ code, title, credits: 2, notionalHours: 100, sourcePage: "188", sourceTable: "Table 2.11.1" })) }),
        g({ id: "mar-y4s1-elective", title: "Year IV Semester I marketing elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 2, year: 4, semester: 1, courses: [["MAR 4274", "Advanced Digital Marketing"], ["MAR 4275", "Entrepreneurial Marketing and Marketing Innovations"], ["MAR 4276", "Customer Relationship Management"]].map(([code, title]) => ({ code, title, credits: 2, notionalHours: 100, sourcePage: "189", sourceTable: "Table 2.11.1" })) }),
        g({ id: "mar-y4s2-option2-elective", title: "Year IV Semester II Option 02 marketing elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 2, applicablePathways: ["research-project"], courses: [["MAR 4380", "International Marketing"], ["MAR 4381", "Advanced Services Marketing"], ["MAR 4382", "Territory Management"], ["MAR 4383", "Technology Marketing"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "189", sourceTable: "Table 2.11.1" })) })
    ];
    const rows = (year, semester, sourcePage, values, pathwayIds) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.11.1", pathwayIds });
    });
    const courses = [
        ...commonFirstYear(programmeId),
        ...rows(2, 1, "188", ["MAR 2370|Marketing Management", "MAR 2371|Communication Skills I", "FIN 2370|Financial Management", "DSC 2370|Operations Management", "BEC 2370|Macroeconomics", "MAR 2272|Fine Arts|2|100"]),
        ...rows(2, 2, "188", ["MAR 2373|Consumer Behaviour", "MAR 2374|Sports and Personality Development I", "BUS 2371|Organizational Behaviour", "MAR 2275|Advanced Marketing Management|2|100", "MAR 2276|Communication Skills II|2|100", "LAW 2271|Legal Aspects in Marketing|2|100"]),
        ...rows(3, 1, "188", ["MAR 3370|Integrated Marketing Communications", "ACC 3380|Management Accounting", "MAR 3271|Research Methodology|2|100", "MAR 3272|Communication Skills III|2|100", "MAR 3273|Sales Force Management|2|100", "MAR 3274|Professionalism in Marketing|2|100", "MAR 3175|Sports and Personality Development II|1|50"]),
        ...rows(3, 2, "188", ["MAR 3379|Product and Brand Management", "MAR 3380|Services Marketing", "ITC 3385|Business Analytics", "MAR 3281|Marketing Research|2|100", "MAR 3282|Digital Marketing|2|100", "MAR 3283|Strategic Marketing|2|100"]),
        ...rows(4, 1, "189", ["MAR 4370|Software Applications for Marketing Research", "MAR 4271|Network Marketing|2|100", "MAR 4272|Sustainability Marketing|2|100", "BUS 4370|Strategic Management"]),
        ...rows(4, 2, "189", ["MAR 4677|Dissertation|6|600"], ["dissertation"]),
        c({ code: "MAR 4678", title: "Internship", credits: 6, notionalHours: 600, year: 4, semester: 2, sourcePage: "189", sourceTable: "Table 2.11.1" }),
        c({ code: "MAR 4284", title: "Marketing Analytics", credits: 2, notionalHours: 100, year: 4, semester: 2, sourcePage: "189", sourceTable: "Table 2.11.1" }),
        ...rows(4, 2, "189", ["MAR 4379|Research Project|3|300"], ["research-project"])
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Marketing Management",
        shortName: "Marketing Management",
        department: "Marketing Management",
        programmeSourcePages: ["183-189"],
        pathways: [
            { id: "dissertation", title: "Option 01 - Dissertation and internship", shortTitle: "Option 01", sourcePage: "189" },
            { id: "research-project", title: "Option 02 - Research project, internship and elective", shortTitle: "Option 02", sourcePage: "189" }
        ],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 16, Y1S2: 15, Y2S1: 17, Y2S2: 15, Y3S1: 17, Y3S2: 17, Y4S1: 12, Y4S2: 14 },
            yearCredits: { Y1: 31, Y2: 32, Y3: 34, Y4: 26 },
            programmeCredits: 123
        }
    });
};
const managementPublicPolicy = () => {
    const programmeId = "management-public-policy";
    const { c, g } = make(programmeId);
    const groups = [
        g({ id: "pub-y3s1-elective", title: "Year III Semester I public policy elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 1, courses: [["DSC 3370", "Operations Research"], ["DSC 3371", "Data Analysis for Managers"], ["ACC 3372", "Auditing and Assurance Services"], ["PUB 3373", "Managing Local Government"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "206", sourceTable: "Table 2.12.1" })) }),
        g({ id: "pub-y3s2-elective", title: "Year III Semester II public policy elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 3, semester: 2, courses: [["PUB 3377", "Empirical Policy Analysis"], ["PUB 3378", "Environmental Management"], ["PUB 3379", "Managerial Skills and Competencies"], ["ACC 3381", "Taxation"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "206", sourceTable: "Table 2.12.1" })) }),
        g({ id: "pub-y4s1-elective", title: "Year IV Semester I public policy elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 1, notes: ["If Practical Training is selected, Internship must also be selected in Year IV Semester II."], courses: [["PUB 4373", "Practical Training"], ["PUB 4374", "Contemporary Issues in Development"], ["PUB 4375", "Comparative Public Administration"], ["PUB 4376", "Disaster Management"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "206", sourceTable: "Table 2.12.1" })) }),
        g({ id: "pub-y4s2-elective", title: "Year IV Semester II public policy elective", requiredSelectionCount: 1, minimumSelectionCount: 1, maximumSelectionCount: 1, requiredCredits: 3, year: 4, semester: 2, courses: [["PUB 4380", "Internship"], ["PUB 4381", "Conflict Resolution and Mediation"], ["PUB 4382", "Public Relations"], ["LAW 4371", "Commercial Law"]].map(([code, title]) => ({ code, title, credits: 3, notionalHours: 150, sourcePage: "207", sourceTable: "Table 2.12.1" })) })
    ];
    const rows = (year, semester, sourcePage, values) => values.map((row) => {
        const [code, title, credits = "3", hours = "150"] = row.split("|");
        return c({ code, title, credits: Number(credits), notionalHours: Number(hours), year, semester, sourcePage, sourceTable: "Table 2.12.1" });
    });
    const courses = [
        ...commonFirstYear(programmeId, "mpp"),
        ...rows(2, 1, "205", ["PUB 2370|Sociology and Psychology", "BEC 2370|Macroeconomics", "FIN 2370|Financial Management", "MAR 2370|Marketing Management", "DSC 2370|Operations Management", "ACC 2370|Management Accounting"]),
        ...rows(2, 2, "206", ["ITC 2372|Business Analytics", "BUS 2371|Organizational Behaviour", "PUB 2371|Theory and Practice of Public Administration", "PUB 2372|Development Administration", "PUB 2373|Managing Rural and Urban Development"]),
        ...rows(3, 1, "206", ["PUB 3370|Public Management", "PUB 3371|Public Finance", "PUB 3372|Research Methodology", "ITC 3371|Management Information Systems and ERP Applications"]),
        ...rows(3, 2, "206", ["PUB 3674|Independent Research Study|6|600", "PUB 3375|Public Policy Analysis", "PUB 3376|Procurement Management"]),
        ...rows(4, 1, "206", ["PUB 4370|E-Governance", "PUB 4371|Public Sector Accounting and Finance", "PUB 4372|Constitutional and Administrative Law", "BUS 4370|Strategic Management"]),
        ...rows(4, 2, "207", ["PUB 4377|Project Management", "PUB 4378|International Relations", "PUB 4379|Development Policy and Management"])
    ];
    return makeProgramme({
        programmeId,
        programmeName: "BSc Honours in Management and Public Policy",
        shortName: "Management and Public Policy",
        department: "Public Administration",
        programmeSourcePages: ["203-207"],
        courses,
        electiveGroups: groups,
        expectedTotals: {
            semesterCredits: { Y1S1: 15, Y1S2: 15, Y2S1: 18, Y2S2: 15, Y3S1: 15, Y3S2: 15, Y4S1: 15, Y4S2: 12 },
            yearCredits: { Y1: 30, Y2: 33, Y3: 30, Y4: 27 },
            programmeCredits: 120
        }
    });
};
export const programmes = [
    accounting(),
    businessAdministration(),
    businessEconomics(),
    bcom(),
    operationsTechnology(),
    entrepreneurship(),
    realEstate(),
    finance(),
    humanResourceManagement(),
    businessInformationSystems(),
    marketingManagement(),
    managementPublicPolicy()
];
export const programmeById = new Map(programmes.map((programme) => [programme.programmeId, programme]));
