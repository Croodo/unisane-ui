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

  // ─── Column Sorting ───
  sortColumn: "कॉलम क्रमबद्ध करें",
  sortDescending: "अवरोही क्रम में करें",
  clearSort: "क्रमबद्धता हटाएं",

  // ─── Column Resize ───
  resizeColumn: "कॉलम का आकार बदलने के लिए खींचें",

  // ─── Row Reorder ───
  dragRowHandle: "पंक्ति को पुनर्व्यवस्थित करने के लिए खींचें। Alt+Arrow कुंजियों का उपयोग करें।",
  dragRowHandleLabel: "पंक्ति {index} को पुनर्व्यवस्थित करने के लिए खींचें। Alt+Arrow कुंजियों का उपयोग करें।",
  srRowMoved: "पंक्ति स्थिति {from} से स्थिति {to} पर ले जाई गई",

  // ─── Tree Data ───
  expandAllNodes: "सभी खोलें",
  collapseAllNodes: "सभी बंद करें",
  loadingChildren: "लोड हो रहा है...",
  noChildren: "कोई आइटम नहीं",
  srNodeExpanded: "नोड {label} विस्तारित",
  srNodeCollapsed: "नोड {label} संक्षिप्त",

  // ─── Infinite Scroll ───
  loadingMore: "और लोड हो रहा है...",
  endOfList: "और आइटम नहीं हैं",
  loadMore: "और लोड करें",
  srItemsLoaded: "{count} आइटम लोड हुए",

  // ─── Clipboard ───
  copy: "कॉपी करें",
  paste: "पेस्ट करें",
  cut: "काटें",
  pasteSuccess: "{count} सेल पेस्ट हुए",
  pasteFailed: "पेस्ट विफल",
  pasteValidationError: "{count} सेल सत्यापन में विफल",
  pasteNoData: "पेस्ट के लिए कोई डेटा नहीं",
  srCellsCopied: "{count} सेल क्लिपबोर्ड पर कॉपी हुए",
  srCellsPasted: "{count} सेल पेस्ट हुए",

  // ─── Undo/Redo ───
  undo: "पूर्ववत करें",
  redo: "फिर से करें",
  undoCellEdit: "{column} संपादन पूर्ववत करें",
  redoCellEdit: "{column} संपादन फिर से करें",
  nothingToUndo: "पूर्ववत करने के लिए कुछ नहीं",
  nothingToRedo: "फिर से करने के लिए कुछ नहीं",
  srUndone: "पूर्ववत किया: {description}",
  srRedone: "फिर से किया: {description}",

  // ─── Filter Presets ───
  presets: "प्रीसेट",
  savePreset: "प्रीसेट के रूप में सेव करें",
  applyPreset: "प्रीसेट लागू करें",
  deletePreset: "प्रीसेट हटाएं",
  editPreset: "प्रीसेट संपादित करें",
  duplicatePreset: "प्रीसेट डुप्लिकेट करें",
  presetName: "प्रीसेट का नाम",
  presetNamePlaceholder: "प्रीसेट का नाम दर्ज करें...",
  quickFilter: "त्वरित फ़िल्टर",
  addQuickFilter: "त्वरित फ़िल्टर में जोड़ें",
  removeQuickFilter: "त्वरित फ़िल्टर से हटाएं",
  defaultPreset: "डिफ़ॉल्ट",
  customPreset: "कस्टम",
  importPresets: "प्रीसेट आयात करें",
  exportPresets: "प्रीसेट निर्यात करें",
  presetSaved: "प्रीसेट \"{name}\" सेव हुआ",
  presetDeleted: "प्रीसेट \"{name}\" हटाया गया",
  presetApplied: "प्रीसेट \"{name}\" लागू हुआ",
  maxPresetsReached: "अधिकतम {max} प्रीसेट सीमा पहुंच गई",
  srPresetApplied: "फ़िल्टर प्रीसेट {name} लागू हुआ",
  srPresetSaved: "फ़िल्टर प्रीसेट {name} सेव हुआ",

  // ─── Compound Filters ───
  filterBuilder: "फ़िल्टर बिल्डर",
  addCondition: "शर्त जोड़ें",
  addFilterGroup: "समूह जोड़ें",
  removeCondition: "शर्त हटाएं",
  removeFilterGroup: "समूह हटाएं",
  operatorAnd: "और",
  operatorOr: "या",
  opEquals: "बराबर है",
  opNotEquals: "बराबर नहीं है",
  opContains: "शामिल है",
  opNotContains: "शामिल नहीं है",
  opStartsWith: "से शुरू होता है",
  opEndsWith: "पर समाप्त होता है",
  opGreaterThan: "से अधिक",
  opLessThan: "से कम",
  opBetween: "के बीच",
  opIsEmpty: "खाली है",
  opIsNotEmpty: "खाली नहीं है",
  opIn: "में है",
  opNotIn: "में नहीं है",
  filterGroupLabel: "फ़िल्टर समूह ({operator})",
  selectColumn: "कॉलम चुनें",
  selectOperator: "ऑपरेटर चुनें",
  enterValue: "मान दर्ज करें",

  // ─── Column Spanning ───
  mergeCells: "सेल मर्ज करें",
  unmergeCells: "सेल अनमर्ज करें",
  spanColumns: "{count} कॉलम स्पैन करें",
  cellMerged: "सेल मर्ज किया गया",
  srCellSpansColumns: "सेल {count} कॉलम में फैला है",

  // ─── Sticky Group Headers ───
  stickyHeader: "स्टिकी हेडर",
  pinnedGroupHeader: "पिन किया गया: {label}",
  srGroupHeaderSticky: "समूह हेडर {label} पिन किया गया है",
  srShowingGroupItems: "{label} में {count} आइटम दिखाए जा रहे हैं",

  // ─── Context Menu ───
  viewDetails: "विवरण देखें",
  edit: "संपादित करें",
  duplicate: "डुप्लिकेट",
  select: "चुनें",
  copyId: "आईडी कॉपी करें",
  delete: "हटाएं",

  // ─── Actions Cell ───
  actions: "कार्रवाई",

  // ─── Row Numbers ───
  rowNumberHeader: "#",
  srRowNumber: "पंक्ति {number}",

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
