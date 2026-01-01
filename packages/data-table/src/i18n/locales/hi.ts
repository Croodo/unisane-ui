import type { DataTableStrings } from "../types";

/**
 * Hindi (हिन्दी) translations for DataTable
 */
export const hiStrings: DataTableStrings = {
  // ─── Empty States ───
  noResults: "कोई परिणाम नहीं मिला",
  noResultsHint: "अपनी खोज या फ़िल्टर बदलकर देखें",
  loading: "डेटा लोड हो रहा है...",

  // ─── Empty Value Indicators ───
  empty: "(खाली)",
  invalidDate: "(अमान्य तिथि)",
  invalidNumber: "(अमान्य संख्या)",

  // ─── Boolean Values ───
  booleanTrue: "हाँ",
  booleanFalse: "नहीं",

  // ─── Pagination ───
  pageOfTotal: "पृष्ठ {page} / {totalPages}",
  rangeOfTotal: "{start}-{end} में से {total}",
  perPage: "{count} प्रति पृष्ठ",
  noItems: "कोई आइटम नहीं",
  itemCount: "{count} आइटम",
  allItems: "सभी आइटम",
  cursorPagination: "{count} आइटम (पृष्ठ {page})",
  previous: "पिछला",
  next: "अगला",

  // ─── Selection ───
  selectedCount: "{count} चयनित",
  selectAll: "सभी पंक्तियाँ चुनें",
  deselectAll: "सभी का चयन हटाएँ",

  // ─── Column Menu ───
  pinLeft: "बाएँ पिन करें",
  unpinLeft: "बाएँ से अनपिन करें",
  pinRight: "दाएँ पिन करें",
  unpinRight: "दाएँ से अनपिन करें",
  hideColumn: "कॉलम छुपाएँ",
  filterBy: "{column} के अनुसार फ़िल्टर करें",
  filterActive: "सक्रिय",
  clearFilter: "फ़िल्टर साफ़ करें",
  searchColumn: "{column} खोजें...",
  apply: "लागू करें",
  clear: "साफ़ करें",
  clearAll: "सभी साफ़ करें",
  filtersLabel: "फ़िल्टर",
  searchLabel: "खोज",

  // ─── Grouping ───
  groupByColumn: "इस कॉलम से समूहित करें",
  removeGrouping: "समूहीकरण हटाएँ",
  addToGrouping: "समूहीकरण में जोड़ें (स्तर {level})",
  groupEmpty: "कोई आइटम नहीं",
  groupItemSingular: "आइटम",
  groupItemPlural: "{count} आइटम",
  expandGroup: "विस्तार करने के लिए क्लिक करें",
  collapseGroup: "संक्षिप्त करने के लिए क्लिक करें",
  groupedByLabel: "के अनुसार समूहित",
  none: "कोई नहीं",
  selectGroupRows: "{label} में सभी {count} पंक्तियाँ चुनें",
  removeGroupingLabel: "{label} समूहीकरण हटाएं",

  // ─── Summary Row ───
  summary: "सारांश",
  summaryTotal: "कुल",
  summaryAverage: "औसत",
  summaryCount: "गणना",
  summaryMin: "न्यूनतम",
  summaryMax: "अधिकतम",

  // ─── Export ───
  export: "निर्यात करें",
  exportCsv: "CSV",
  exportCsvDesc: "कॉमा-सेपरेटेड वैल्यूज़",
  exportExcel: "Excel",
  exportExcelDesc: "माइक्रोसॉफ्ट एक्सेल (.xlsx)",
  exportPdf: "PDF",
  exportPdfDesc: "पोर्टेबल डॉक्यूमेंट फ़ॉर्मेट",
  exportJson: "JSON",
  exportJsonDesc: "जावास्क्रिप्ट ऑब्जेक्ट नोटेशन",

  // ─── Search ───
  searchPlaceholder: "खोजें...",
  openSearch: "खोज खोलें",
  clearSearch: "खोज साफ़ करें",

  // ─── Row Actions ───
  expandRow: "पंक्ति विस्तार करें",
  collapseRow: "पंक्ति संक्षिप्त करें",
  selectRowLabel: "पंक्ति {id} चुनें",

  // ─── Toolbar ───
  columns: "कॉलम",
  density: "घनत्व",
  densityCompact: "संक्षिप्त",
  densityDense: "सघन",
  densityStandard: "मानक",
  densityComfortable: "आरामदायक",
  moreActions: "और",
  filter: "फ़िल्टर",
  download: "डाउनलोड",
  print: "प्रिंट",
  refresh: "रिफ्रेश",
  expandAllGroups: "सभी समूह खोलें",
  collapseAllGroups: "सभी समूह बंद करें",

  // ─── Frozen Columns ───
  frozenLeft: "{count} बाएं",
  frozenRight: "{count} दाएं",
  unfreezeAll: "सभी कॉलम अनफ्रीज़ करें",

  // ─── Column Resize ───
  resizeColumn: "कॉलम का आकार बदलने के लिए खींचें",

  // ─── Row Reorder ───
  dragRowHandle: "पंक्ति को पुनर्व्यवस्थित करने के लिए खींचें। Alt+Arrow कुंजियों का उपयोग करें।",
  srRowMoved: "पंक्ति स्थिति {from} से स्थिति {to} पर ले जाई गई",

  // ─── Context Menu ───
  viewDetails: "विवरण देखें",
  edit: "संपादित करें",
  duplicate: "डुप्लिकेट",
  select: "चुनें",
  copyId: "आईडी कॉपी करें",
  delete: "हटाएं",

  // ─── Errors ───
  errorTitle: "कुछ गलत हो गया",
  errorMessage: "तालिका लोड करते समय एक अप्रत्याशित त्रुटि हुई।",
  errorDetails: "त्रुटि विवरण",
  retry: "पुनः प्रयास करें",

  // ─── Screen Reader Announcements ───
  srStatusUpdate: "{selectedCount} पंक्ति(याँ) चयनित। {totalCount} परिणाम दिखाए जा रहे हैं। {sortInfo}",
  srSortedAsc: "{column} के अनुसार आरोही क्रम में",
  srSortedDesc: "{column} के अनुसार अवरोही क्रम में",
  srNotSorted: "क्रमबद्ध नहीं",
  srFilterApplied: "{count} फ़िल्टर लागू",
  srFilterCleared: "सभी फ़िल्टर साफ़",
  srRowSelected: "पंक्ति {id} चयनित",
  srRowDeselected: "पंक्ति {id} का चयन हटाया गया",
  srAllSelected: "सभी {count} पंक्तियाँ चयनित",
  srAllDeselected: "सभी पंक्तियों का चयन हटाया गया",
  srGroupExpanded: "समूह {label} विस्तारित",
  srGroupCollapsed: "समूह {label} संक्षिप्त",
  srTableDescription: "{rowCount} पंक्तियों और {columnCount} कॉलमों वाली डेटा तालिका",
};
