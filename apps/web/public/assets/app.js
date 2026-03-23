// packages/i18n/src/index.js
var defaultLocale = "en";
var localeLabels = Object.freeze({
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese"
});
var baseMessages = Object.freeze({
  "app.name": "Faith Counseling",
  "brand.title": "Faith Counseling",
  "brand.subtitle": "Practice Workspace",
  "auth.title": "Sign in to workspace",
  "auth.subtitle": "Select a role to preview role-aware navigation and permissions.",
  "auth.roleLabel": "Role",
  "auth.continue": "Continue",
  "nav.dashboard": "Dashboard",
  "nav.clients": "Clients",
  "nav.scheduling": "Scheduling",
  "nav.clinical": "Clinical Chart",
  "nav.documents": "Documents",
  "nav.billing": "Billing",
  "nav.portal": "Portal",
  "header.title": "Operations Dashboard",
  "header.subtitle": "Today at a glance across locations, counselors, and clinical actions.",
  "header.connectionLoading": "Loading live API status...",
  "header.searchPlaceholder": "Search clients, notes, documents...",
  "header.quickActions": "Quick Actions",
  "header.signOut": "Sign out",
  "header.newAppointment": "New Appointment",
  "header.notSignedIn": "Not signed in",
  "header.signedIn": "Signed in",
  "header.language": "Language",
  "metrics.sessions": "Today's Sessions",
  "metrics.roles": "Role Profiles",
  "metrics.apptTypes": "Appointment Types",
  "metrics.audit": "Audit Event Sync",
  "panels.schedule": "Today's Schedule",
  "panels.priority": "Priority Queue",
  "panels.compliance": "Compliance Watch",
  "panels.manage": "Operations Studio",
  "panels.careFlow": "Care Flow Health",
  "panels.telemetry": "Telemetry & Experience",
  "careFlow.intake": "New Intake to First Session",
  "careFlow.treatment": "Treatment Plan Updates This Week",
  "careFlow.documents": "Signed Document Turnaround",
  "buttons.viewCalendar": "View Calendar",
  "buttons.openReport": "Open Report",
  "manage.tab.clients": "Clients",
  "manage.tab.appointments": "Appointments",
  "manage.tab.language": "Language Studio",
  "manage.section.createClient": "Create Client",
  "manage.section.updateClient": "Update Client",
  "manage.section.updateAppointment": "Update Appointment",
  "manage.section.createAppointment": "Create Appointment",
  "manage.section.language": "Language Studio",
  "manage.section.translationConfig": "Translation Configuration",
  "form.firstName": "First Name",
  "form.lastName": "Last Name",
  "form.faithBackground": "Faith Background",
  "form.initialStatus": "Initial Status",
  "form.client": "Client",
  "form.clientStatus": "Client Status",
  "form.appointment": "Appointment",
  "form.appointmentStatus": "Appointment Status",
  "form.appointmentType": "Appointment Type",
  "form.newAppointmentClient": "New Appointment Client",
  "form.startTime": "Start Time",
  "form.endTime": "End Time",
  "form.counselor": "Counselor",
  "form.location": "Location",
  "form.remoteSession": "Remote Session",
  "form.localeCode": "Locale Code",
  "form.localeLabel": "Locale Label",
  "form.translationFilter": "Filter Keys",
  "form.translationFilterPlaceholder": "Search translation keys...",
  "form.translationSourceLocale": "Source Locale",
  "form.translationTone": "Tone",
  "form.translationFallbackMode": "Fallback Mode",
  "form.translationUseGlossary": "Apply glossary replacements",
  "form.translationGlossary": "Glossary (one pair per line: source=target)",
  "form.translationGlossaryPlaceholder": "Faith Counseling=Consejer\xEDa de Fe",
  "form.firstNamePlaceholder": "First name",
  "form.lastNamePlaceholder": "Last name",
  "form.faithBackgroundPlaceholder": "Evangelical, Catholic, etc.",
  "form.counselorPlaceholder": "Counselor name",
  "form.locationPlaceholder": "Room or Remote",
  "form.localeCodePlaceholder": "es",
  "form.localeLabelPlaceholder": "Spanish",
  "actions.createClient": "Create Client",
  "actions.updateClient": "Update Client",
  "actions.updateAppointment": "Update Appointment",
  "actions.createAppointment": "Create Appointment",
  "actions.cancelAppointment": "Cancel Appointment",
  "actions.deleteAppointment": "Delete Appointment",
  "actions.createLocale": "Create Locale",
  "actions.autoTranslate": "Auto Translate",
  "actions.saveTranslations": "Save Translations",
  "actions.saveTranslationConfig": "Save Translation Config",
  "actions.refreshTelemetry": "Refresh Telemetry",
  "language.help": "Create a locale, auto-generate draft translations, then edit any phrase to match your preferred wording.",
  "language.configHelp": "Configure source language, fallback behavior, and glossary overrides for this locale.",
  "language.locale": "Locale",
  "language.editor": "Translation Editor",
  "language.empty": "No translation keys match your filter.",
  "language.tone.neutral": "Neutral",
  "language.tone.pastoral": "Pastoral",
  "language.tone.clinical": "Clinical",
  "language.fallback.prefixed": "Prefixed fallback ([locale] text)",
  "language.fallback.copy": "Copy source text",
  "telemetry.backend": "Backend Performance",
  "telemetry.frontend": "User Experience",
  "telemetry.infrastructure": "Infrastructure",
  "telemetry.requestLatency": "Request Latency",
  "telemetry.activeRequests": "Active Requests",
  "telemetry.proxyLatency": "Proxy Latency",
  "telemetry.heapUsage": "Heap Usage",
  "telemetry.uptime": "Uptime",
  "telemetry.lcp": "Largest Contentful Paint",
  "telemetry.cls": "Cumulative Layout Shift",
  "telemetry.inp": "Interaction to Next Paint",
  "telemetry.fcp": "First Contentful Paint",
  "telemetry.ttfb": "Time to First Byte",
  "state.loading": "Loading...",
  "state.loadingDashboard": "Fetching live dashboard data.",
  "state.noResults": "No matching results",
  "state.tryBroader": "Try a broader search query.",
  "status.active": "Active",
  "status.waitlist": "Waitlist",
  "status.inactive": "Inactive",
  "status.discharged": "Discharged",
  "status.scheduled": "Scheduled",
  "status.checked_in": "Checked In",
  "status.completed": "Completed",
  "status.cancelled": "Cancelled",
  "status.no_show": "No Show",
  "message.selectClient": "Select a client and status first.",
  "message.selectAppointment": "Select an appointment and status first.",
  "message.enterClientName": "Enter both first and last name to create a client.",
  "message.chooseAppointmentTime": "Choose a client and valid start/end times.",
  "message.saving": "Saving changes...",
  "message.clientUpdated": "Client updated.",
  "message.clientCreated": "Client created: {name}.",
  "message.appointmentUpdated": "Appointment updated.",
  "message.appointmentCreated": "Appointment created.",
  "message.localeCreated": "Locale created.",
  "message.translationsSaved": "Translations saved.",
  "message.autoTranslated": "Draft translations generated.",
  "message.loadingTranslations": "Loading translations...",
  "message.refreshingTelemetry": "Refreshing telemetry...",
  "message.cancelConfirm": "Cancel this appointment?",
  "message.deleteConfirm": "Delete this appointment permanently?",
  "message.appointmentCancelled": "Appointment cancelled.",
  "message.appointmentDeleted": "Appointment deleted.",
  "message.telemetryUnavailable": "Telemetry temporarily unavailable.",
  "message.localeRequired": "Enter a locale code first.",
  "message.localeLoaded": "Locale loaded.",
  "message.translationConfigSaved": "Translation configuration saved.",
  "message.invalidGlossary": "Glossary lines must use source=target format."
});
function listMessageKeys() {
  return Object.keys(baseMessages);
}
function buildLocaleCatalog(overrides = {}) {
  return {
    ...baseMessages,
    ...overrides
  };
}
function formatMessage(messages, key, values = {}) {
  const template = messages[key] ?? baseMessages[key] ?? key;
  return Object.entries(values).reduce((result, [name, value]) => {
    return result.replaceAll(`{${name}}`, String(value));
  }, template);
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/browser/globalThis.js
var _globalThis = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/version.js
var VERSION = "1.9.0";

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/semver.js
var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
  var acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  var rejectedVersions = /* @__PURE__ */ new Set();
  var myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return function() {
      return false;
    };
  }
  var ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v2) {
    rejectedVersions.add(v2);
    return false;
  }
  function _accept(v2) {
    acceptedVersions.add(v2);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    var globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    var globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
var isCompatible = _makeCompatibilityCheck(VERSION);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
var major = VERSION.split(".")[0];
var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for("opentelemetry.js.api." + major);
var _global = _globalThis;
function registerGlobal(type, instance, diag3, allowOverride) {
  var _a;
  if (allowOverride === void 0) {
    allowOverride = false;
  }
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
    version: VERSION
  };
  if (!allowOverride && api[type]) {
    var err = new Error("@opentelemetry/api: Attempted duplicate registration of API: " + type);
    diag3.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION) {
    var err = new Error("@opentelemetry/api: Registration of version v" + api.version + " for " + type + " does not match previously registered API v" + VERSION);
    diag3.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag3.debug("@opentelemetry/api: Registered a global for " + type + " v" + VERSION + ".");
  return true;
}
function getGlobal(type) {
  var _a, _b;
  var globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag3) {
  diag3.debug("@opentelemetry/api: Unregistering a global for " + type + " v" + VERSION + ".");
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
var __read = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i2 = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"])) m2.call(i2);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i2 = 0, l2 = from.length, ar; i2 < l2; i2++) {
    if (ar || !(i2 in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
      ar[i2] = from[i2];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var DiagComponentLogger = (
  /** @class */
  (function() {
    function DiagComponentLogger2(props) {
      this._namespace = props.namespace || "DiagComponentLogger";
    }
    DiagComponentLogger2.prototype.debug = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("debug", this._namespace, args);
    };
    DiagComponentLogger2.prototype.error = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("error", this._namespace, args);
    };
    DiagComponentLogger2.prototype.info = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("info", this._namespace, args);
    };
    DiagComponentLogger2.prototype.warn = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("warn", this._namespace, args);
    };
    DiagComponentLogger2.prototype.verbose = function() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      return logProxy("verbose", this._namespace, args);
    };
    return DiagComponentLogger2;
  })()
);
function logProxy(funcName, namespace, args) {
  var logger3 = getGlobal("diag");
  if (!logger3) {
    return;
  }
  args.unshift(namespace);
  return logger3[funcName].apply(logger3, __spreadArray([], __read(args), false));
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js
var DiagLogLevel;
(function(DiagLogLevel2) {
  DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
  DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
  DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
  DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
  DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
  DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
  DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger3) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger3 = logger3 || {};
  function _filterFunc(funcName, theLevel) {
    var theFunc = logger3[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger3);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/diag.js
var __read2 = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i2 = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"])) m2.call(i2);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
};
var __spreadArray2 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i2 = 0, l2 = from.length, ar; i2 < l2; i2++) {
    if (ar || !(i2 in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
      ar[i2] = from[i2];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME = "diag";
var DiagAPI = (
  /** @class */
  (function() {
    function DiagAPI2() {
      function _logProxy(funcName) {
        return function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var logger3 = getGlobal("diag");
          if (!logger3)
            return;
          return logger3[funcName].apply(logger3, __spreadArray2([], __read2(args), false));
        };
      }
      var self2 = this;
      var setLogger = function(logger3, optionsOrLogLevel) {
        var _a, _b, _c;
        if (optionsOrLogLevel === void 0) {
          optionsOrLogLevel = { logLevel: DiagLogLevel.INFO };
        }
        if (logger3 === self2) {
          var err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
          self2.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
          return false;
        }
        if (typeof optionsOrLogLevel === "number") {
          optionsOrLogLevel = {
            logLevel: optionsOrLogLevel
          };
        }
        var oldLogger = getGlobal("diag");
        var newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger3);
        if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
          var stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
          oldLogger.warn("Current logger will be overwritten from " + stack);
          newLogger.warn("Current logger will overwrite one already registered from " + stack);
        }
        return registerGlobal("diag", newLogger, self2, true);
      };
      self2.setLogger = setLogger;
      self2.disable = function() {
        unregisterGlobal(API_NAME, self2);
      };
      self2.createComponentLogger = function(options) {
        return new DiagComponentLogger(options);
      };
      self2.verbose = _logProxy("verbose");
      self2.debug = _logProxy("debug");
      self2.info = _logProxy("info");
      self2.warn = _logProxy("warn");
      self2.error = _logProxy("error");
    }
    DiagAPI2.instance = function() {
      if (!this._instance) {
        this._instance = new DiagAPI2();
      }
      return this._instance;
    };
    return DiagAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js
var __read3 = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i2 = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"])) m2.call(i2);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
};
var __values = function(o2) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m2 = s2 && o2[s2], i2 = 0;
  if (m2) return m2.call(o2);
  if (o2 && typeof o2.length === "number") return {
    next: function() {
      if (o2 && i2 >= o2.length) o2 = void 0;
      return { value: o2 && o2[i2++], done: !o2 };
    }
  };
  throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var BaggageImpl = (
  /** @class */
  (function() {
    function BaggageImpl2(entries) {
      this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
    }
    BaggageImpl2.prototype.getEntry = function(key) {
      var entry = this._entries.get(key);
      if (!entry) {
        return void 0;
      }
      return Object.assign({}, entry);
    };
    BaggageImpl2.prototype.getAllEntries = function() {
      return Array.from(this._entries.entries()).map(function(_a) {
        var _b = __read3(_a, 2), k2 = _b[0], v2 = _b[1];
        return [k2, v2];
      });
    };
    BaggageImpl2.prototype.setEntry = function(key, entry) {
      var newBaggage = new BaggageImpl2(this._entries);
      newBaggage._entries.set(key, entry);
      return newBaggage;
    };
    BaggageImpl2.prototype.removeEntry = function(key) {
      var newBaggage = new BaggageImpl2(this._entries);
      newBaggage._entries.delete(key);
      return newBaggage;
    };
    BaggageImpl2.prototype.removeEntries = function() {
      var e_1, _a;
      var keys = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        keys[_i] = arguments[_i];
      }
      var newBaggage = new BaggageImpl2(this._entries);
      try {
        for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
          var key = keys_1_1.value;
          newBaggage._entries.delete(key);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return newBaggage;
    };
    BaggageImpl2.prototype.clear = function() {
      return new BaggageImpl2();
    };
    return BaggageImpl2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js
var baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/utils.js
var diag = DiagAPI.instance();
function createBaggage(entries) {
  if (entries === void 0) {
    entries = {};
  }
  return new BaggageImpl(new Map(Object.entries(entries)));
}
function baggageEntryMetadataFromString(str) {
  if (typeof str !== "string") {
    diag.error("Cannot create baggage metadata from unknown type: " + typeof str);
    str = "";
  }
  return {
    __TYPE__: baggageEntryMetadataSymbol,
    toString: function() {
      return str;
    }
  };
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/context.js
function createContextKey(description) {
  return Symbol.for(description);
}
var BaseContext = (
  /** @class */
  /* @__PURE__ */ (function() {
    function BaseContext2(parentContext) {
      var self2 = this;
      self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
      self2.getValue = function(key) {
        return self2._currentContext.get(key);
      };
      self2.setValue = function(key, value) {
        var context2 = new BaseContext2(self2._currentContext);
        context2._currentContext.set(key, value);
        return context2;
      };
      self2.deleteValue = function(key) {
        var context2 = new BaseContext2(self2._currentContext);
        context2._currentContext.delete(key);
        return context2;
      };
    }
    return BaseContext2;
  })()
);
var ROOT_CONTEXT = new BaseContext();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js
var __extends = /* @__PURE__ */ (function() {
  var extendStatics = function(d2, b2) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b3) {
      d3.__proto__ = b3;
    } || function(d3, b3) {
      for (var p2 in b3) if (Object.prototype.hasOwnProperty.call(b3, p2)) d3[p2] = b3[p2];
    };
    return extendStatics(d2, b2);
  };
  return function(d2, b2) {
    if (typeof b2 !== "function" && b2 !== null)
      throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
    extendStatics(d2, b2);
    function __() {
      this.constructor = d2;
    }
    d2.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
  };
})();
var NoopMeter = (
  /** @class */
  (function() {
    function NoopMeter2() {
    }
    NoopMeter2.prototype.createGauge = function(_name, _options) {
      return NOOP_GAUGE_METRIC;
    };
    NoopMeter2.prototype.createHistogram = function(_name, _options) {
      return NOOP_HISTOGRAM_METRIC;
    };
    NoopMeter2.prototype.createCounter = function(_name, _options) {
      return NOOP_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createUpDownCounter = function(_name, _options) {
      return NOOP_UP_DOWN_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createObservableGauge = function(_name, _options) {
      return NOOP_OBSERVABLE_GAUGE_METRIC;
    };
    NoopMeter2.prototype.createObservableCounter = function(_name, _options) {
      return NOOP_OBSERVABLE_COUNTER_METRIC;
    };
    NoopMeter2.prototype.createObservableUpDownCounter = function(_name, _options) {
      return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
    };
    NoopMeter2.prototype.addBatchObservableCallback = function(_callback, _observables) {
    };
    NoopMeter2.prototype.removeBatchObservableCallback = function(_callback) {
    };
    return NoopMeter2;
  })()
);
var NoopMetric = (
  /** @class */
  /* @__PURE__ */ (function() {
    function NoopMetric2() {
    }
    return NoopMetric2;
  })()
);
var NoopCounterMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopCounterMetric2, _super);
    function NoopCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopCounterMetric2.prototype.add = function(_value, _attributes) {
    };
    return NoopCounterMetric2;
  })(NoopMetric)
);
var NoopUpDownCounterMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopUpDownCounterMetric2, _super);
    function NoopUpDownCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopUpDownCounterMetric2.prototype.add = function(_value, _attributes) {
    };
    return NoopUpDownCounterMetric2;
  })(NoopMetric)
);
var NoopGaugeMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopGaugeMetric2, _super);
    function NoopGaugeMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopGaugeMetric2.prototype.record = function(_value, _attributes) {
    };
    return NoopGaugeMetric2;
  })(NoopMetric)
);
var NoopHistogramMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopHistogramMetric2, _super);
    function NoopHistogramMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    NoopHistogramMetric2.prototype.record = function(_value, _attributes) {
    };
    return NoopHistogramMetric2;
  })(NoopMetric)
);
var NoopObservableMetric = (
  /** @class */
  (function() {
    function NoopObservableMetric2() {
    }
    NoopObservableMetric2.prototype.addCallback = function(_callback) {
    };
    NoopObservableMetric2.prototype.removeCallback = function(_callback) {
    };
    return NoopObservableMetric2;
  })()
);
var NoopObservableCounterMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopObservableCounterMetric2, _super);
    function NoopObservableCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableCounterMetric2;
  })(NoopObservableMetric)
);
var NoopObservableGaugeMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopObservableGaugeMetric2, _super);
    function NoopObservableGaugeMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableGaugeMetric2;
  })(NoopObservableMetric)
);
var NoopObservableUpDownCounterMetric = (
  /** @class */
  (function(_super) {
    __extends(NoopObservableUpDownCounterMetric2, _super);
    function NoopObservableUpDownCounterMetric2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoopObservableUpDownCounterMetric2;
  })(NoopObservableMetric)
);
var NOOP_METER = new NoopMeter();
var NOOP_COUNTER_METRIC = new NoopCounterMetric();
var NOOP_GAUGE_METRIC = new NoopGaugeMetric();
var NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
var NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
var NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
var NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
var NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
function createNoopMeter() {
  return NOOP_METER;
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js
var defaultTextMapGetter = {
  get: function(carrier, key) {
    if (carrier == null) {
      return void 0;
    }
    return carrier[key];
  },
  keys: function(carrier) {
    if (carrier == null) {
      return [];
    }
    return Object.keys(carrier);
  }
};
var defaultTextMapSetter = {
  set: function(carrier, key, value) {
    if (carrier == null) {
      return;
    }
    carrier[key] = value;
  }
};

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var __read4 = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i2 = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"])) m2.call(i2);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
};
var __spreadArray3 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i2 = 0, l2 = from.length, ar; i2 < l2; i2++) {
    if (ar || !(i2 in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
      ar[i2] = from[i2];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var NoopContextManager = (
  /** @class */
  (function() {
    function NoopContextManager2() {
    }
    NoopContextManager2.prototype.active = function() {
      return ROOT_CONTEXT;
    };
    NoopContextManager2.prototype.with = function(_context, fn, thisArg) {
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return fn.call.apply(fn, __spreadArray3([thisArg], __read4(args), false));
    };
    NoopContextManager2.prototype.bind = function(_context, target) {
      return target;
    };
    NoopContextManager2.prototype.enable = function() {
      return this;
    };
    NoopContextManager2.prototype.disable = function() {
      return this;
    };
    return NoopContextManager2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/context.js
var __read5 = function(o2, n2) {
  var m2 = typeof Symbol === "function" && o2[Symbol.iterator];
  if (!m2) return o2;
  var i2 = m2.call(o2), r2, ar = [], e2;
  try {
    while ((n2 === void 0 || n2-- > 0) && !(r2 = i2.next()).done) ar.push(r2.value);
  } catch (error) {
    e2 = { error };
  } finally {
    try {
      if (r2 && !r2.done && (m2 = i2["return"])) m2.call(i2);
    } finally {
      if (e2) throw e2.error;
    }
  }
  return ar;
};
var __spreadArray4 = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i2 = 0, l2 = from.length, ar; i2 < l2; i2++) {
    if (ar || !(i2 in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
      ar[i2] = from[i2];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
var API_NAME2 = "context";
var NOOP_CONTEXT_MANAGER = new NoopContextManager();
var ContextAPI = (
  /** @class */
  (function() {
    function ContextAPI2() {
    }
    ContextAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new ContextAPI2();
      }
      return this._instance;
    };
    ContextAPI2.prototype.setGlobalContextManager = function(contextManager) {
      return registerGlobal(API_NAME2, contextManager, DiagAPI.instance());
    };
    ContextAPI2.prototype.active = function() {
      return this._getContextManager().active();
    };
    ContextAPI2.prototype.with = function(context2, fn, thisArg) {
      var _a;
      var args = [];
      for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
      }
      return (_a = this._getContextManager()).with.apply(_a, __spreadArray4([context2, fn, thisArg], __read5(args), false));
    };
    ContextAPI2.prototype.bind = function(context2, target) {
      return this._getContextManager().bind(context2, target);
    };
    ContextAPI2.prototype._getContextManager = function() {
      return getGlobal(API_NAME2) || NOOP_CONTEXT_MANAGER;
    };
    ContextAPI2.prototype.disable = function() {
      this._getContextManager().disable();
      unregisterGlobal(API_NAME2, DiagAPI.instance());
    };
    return ContextAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
var TraceFlags;
(function(TraceFlags2) {
  TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
  TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js
var INVALID_SPANID = "0000000000000000";
var INVALID_TRACEID = "00000000000000000000000000000000";
var INVALID_SPAN_CONTEXT = {
  traceId: INVALID_TRACEID,
  spanId: INVALID_SPANID,
  traceFlags: TraceFlags.NONE
};

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
var NonRecordingSpan = (
  /** @class */
  (function() {
    function NonRecordingSpan2(_spanContext) {
      if (_spanContext === void 0) {
        _spanContext = INVALID_SPAN_CONTEXT;
      }
      this._spanContext = _spanContext;
    }
    NonRecordingSpan2.prototype.spanContext = function() {
      return this._spanContext;
    };
    NonRecordingSpan2.prototype.setAttribute = function(_key, _value) {
      return this;
    };
    NonRecordingSpan2.prototype.setAttributes = function(_attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addEvent = function(_name, _attributes) {
      return this;
    };
    NonRecordingSpan2.prototype.addLink = function(_link) {
      return this;
    };
    NonRecordingSpan2.prototype.addLinks = function(_links) {
      return this;
    };
    NonRecordingSpan2.prototype.setStatus = function(_status) {
      return this;
    };
    NonRecordingSpan2.prototype.updateName = function(_name) {
      return this;
    };
    NonRecordingSpan2.prototype.end = function(_endTime) {
    };
    NonRecordingSpan2.prototype.isRecording = function() {
      return false;
    };
    NonRecordingSpan2.prototype.recordException = function(_exception, _time) {
    };
    return NonRecordingSpan2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
var SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
function getSpan(context2) {
  return context2.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context2, span) {
  return context2.setValue(SPAN_KEY, span);
}
function deleteSpan(context2) {
  return context2.deleteValue(SPAN_KEY);
}
function setSpanContext(context2, spanContext) {
  return setSpan(context2, new NonRecordingSpan(spanContext));
}
function getSpanContext(context2) {
  var _a;
  return (_a = getSpan(context2)) === null || _a === void 0 ? void 0 : _a.spanContext();
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
var VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
var VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
function isValidTraceId(traceId) {
  return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
var contextApi = ContextAPI.getInstance();
var NoopTracer = (
  /** @class */
  (function() {
    function NoopTracer2() {
    }
    NoopTracer2.prototype.startSpan = function(name, options, context2) {
      if (context2 === void 0) {
        context2 = contextApi.active();
      }
      var root = Boolean(options === null || options === void 0 ? void 0 : options.root);
      if (root) {
        return new NonRecordingSpan();
      }
      var parentFromContext = context2 && getSpanContext(context2);
      if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
        return new NonRecordingSpan(parentFromContext);
      } else {
        return new NonRecordingSpan();
      }
    };
    NoopTracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
      var opts;
      var ctx;
      var fn;
      if (arguments.length < 2) {
        return;
      } else if (arguments.length === 2) {
        fn = arg2;
      } else if (arguments.length === 3) {
        opts = arg2;
        fn = arg3;
      } else {
        opts = arg2;
        ctx = arg3;
        fn = arg4;
      }
      var parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
      var span = this.startSpan(name, opts, parentContext);
      var contextWithSpanSet = setSpan(parentContext, span);
      return contextApi.with(contextWithSpanSet, fn, void 0, span);
    };
    return NoopTracer2;
  })()
);
function isSpanContext(spanContext) {
  return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER = new NoopTracer();
var ProxyTracer = (
  /** @class */
  (function() {
    function ProxyTracer2(_provider, name, version, options) {
      this._provider = _provider;
      this.name = name;
      this.version = version;
      this.options = options;
    }
    ProxyTracer2.prototype.startSpan = function(name, options, context2) {
      return this._getTracer().startSpan(name, options, context2);
    };
    ProxyTracer2.prototype.startActiveSpan = function(_name, _options, _context, _fn) {
      var tracer = this._getTracer();
      return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    };
    ProxyTracer2.prototype._getTracer = function() {
      if (this._delegate) {
        return this._delegate;
      }
      var tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
      if (!tracer) {
        return NOOP_TRACER;
      }
      this._delegate = tracer;
      return this._delegate;
    };
    return ProxyTracer2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
var NoopTracerProvider = (
  /** @class */
  (function() {
    function NoopTracerProvider2() {
    }
    NoopTracerProvider2.prototype.getTracer = function(_name, _version, _options) {
      return new NoopTracer();
    };
    return NoopTracerProvider2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER = new NoopTracerProvider();
var ProxyTracerProvider = (
  /** @class */
  (function() {
    function ProxyTracerProvider2() {
    }
    ProxyTracerProvider2.prototype.getTracer = function(name, version, options) {
      var _a;
      return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer(this, name, version, options);
    };
    ProxyTracerProvider2.prototype.getDelegate = function() {
      var _a;
      return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
    };
    ProxyTracerProvider2.prototype.setDelegate = function(delegate) {
      this._delegate = delegate;
    };
    ProxyTracerProvider2.prototype.getDelegateTracer = function(name, version, options) {
      var _a;
      return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
    };
    return ProxyTracerProvider2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js
var SamplingDecision;
(function(SamplingDecision3) {
  SamplingDecision3[SamplingDecision3["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision3[SamplingDecision3["RECORD"] = 1] = "RECORD";
  SamplingDecision3[SamplingDecision3["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js
var SpanKind;
(function(SpanKind2) {
  SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
  SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
  SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
  SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
  SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js
var SpanStatusCode;
(function(SpanStatusCode2) {
  SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
  SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
  SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context-api.js
var context = ContextAPI.getInstance();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js
var diag2 = DiagAPI.instance();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js
var NoopMeterProvider = (
  /** @class */
  (function() {
    function NoopMeterProvider2() {
    }
    NoopMeterProvider2.prototype.getMeter = function(_name, _version, _options) {
      return NOOP_METER;
    };
    return NoopMeterProvider2;
  })()
);
var NOOP_METER_PROVIDER = new NoopMeterProvider();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/metrics.js
var API_NAME3 = "metrics";
var MetricsAPI = (
  /** @class */
  (function() {
    function MetricsAPI2() {
    }
    MetricsAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new MetricsAPI2();
      }
      return this._instance;
    };
    MetricsAPI2.prototype.setGlobalMeterProvider = function(provider) {
      return registerGlobal(API_NAME3, provider, DiagAPI.instance());
    };
    MetricsAPI2.prototype.getMeterProvider = function() {
      return getGlobal(API_NAME3) || NOOP_METER_PROVIDER;
    };
    MetricsAPI2.prototype.getMeter = function(name, version, options) {
      return this.getMeterProvider().getMeter(name, version, options);
    };
    MetricsAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME3, DiagAPI.instance());
    };
    return MetricsAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics-api.js
var metrics = MetricsAPI.getInstance();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js
var NoopTextMapPropagator = (
  /** @class */
  (function() {
    function NoopTextMapPropagator2() {
    }
    NoopTextMapPropagator2.prototype.inject = function(_context, _carrier) {
    };
    NoopTextMapPropagator2.prototype.extract = function(context2, _carrier) {
      return context2;
    };
    NoopTextMapPropagator2.prototype.fields = function() {
      return [];
    };
    return NoopTextMapPropagator2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js
var BAGGAGE_KEY = createContextKey("OpenTelemetry Baggage Key");
function getBaggage(context2) {
  return context2.getValue(BAGGAGE_KEY) || void 0;
}
function getActiveBaggage() {
  return getBaggage(ContextAPI.getInstance().active());
}
function setBaggage(context2, baggage) {
  return context2.setValue(BAGGAGE_KEY, baggage);
}
function deleteBaggage(context2) {
  return context2.deleteValue(BAGGAGE_KEY);
}

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/propagation.js
var API_NAME4 = "propagation";
var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
var PropagationAPI = (
  /** @class */
  (function() {
    function PropagationAPI2() {
      this.createBaggage = createBaggage;
      this.getBaggage = getBaggage;
      this.getActiveBaggage = getActiveBaggage;
      this.setBaggage = setBaggage;
      this.deleteBaggage = deleteBaggage;
    }
    PropagationAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new PropagationAPI2();
      }
      return this._instance;
    };
    PropagationAPI2.prototype.setGlobalPropagator = function(propagator) {
      return registerGlobal(API_NAME4, propagator, DiagAPI.instance());
    };
    PropagationAPI2.prototype.inject = function(context2, carrier, setter) {
      if (setter === void 0) {
        setter = defaultTextMapSetter;
      }
      return this._getGlobalPropagator().inject(context2, carrier, setter);
    };
    PropagationAPI2.prototype.extract = function(context2, carrier, getter) {
      if (getter === void 0) {
        getter = defaultTextMapGetter;
      }
      return this._getGlobalPropagator().extract(context2, carrier, getter);
    };
    PropagationAPI2.prototype.fields = function() {
      return this._getGlobalPropagator().fields();
    };
    PropagationAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME4, DiagAPI.instance());
    };
    PropagationAPI2.prototype._getGlobalPropagator = function() {
      return getGlobal(API_NAME4) || NOOP_TEXT_MAP_PROPAGATOR;
    };
    return PropagationAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation-api.js
var propagation = PropagationAPI.getInstance();

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME5 = "trace";
var TraceAPI = (
  /** @class */
  (function() {
    function TraceAPI2() {
      this._proxyTracerProvider = new ProxyTracerProvider();
      this.wrapSpanContext = wrapSpanContext;
      this.isSpanContextValid = isSpanContextValid;
      this.deleteSpan = deleteSpan;
      this.getSpan = getSpan;
      this.getActiveSpan = getActiveSpan;
      this.getSpanContext = getSpanContext;
      this.setSpan = setSpan;
      this.setSpanContext = setSpanContext;
    }
    TraceAPI2.getInstance = function() {
      if (!this._instance) {
        this._instance = new TraceAPI2();
      }
      return this._instance;
    };
    TraceAPI2.prototype.setGlobalTracerProvider = function(provider) {
      var success = registerGlobal(API_NAME5, this._proxyTracerProvider, DiagAPI.instance());
      if (success) {
        this._proxyTracerProvider.setDelegate(provider);
      }
      return success;
    };
    TraceAPI2.prototype.getTracerProvider = function() {
      return getGlobal(API_NAME5) || this._proxyTracerProvider;
    };
    TraceAPI2.prototype.getTracer = function(name, version) {
      return this.getTracerProvider().getTracer(name, version);
    };
    TraceAPI2.prototype.disable = function() {
      unregisterGlobal(API_NAME5, DiagAPI.instance());
      this._proxyTracerProvider = new ProxyTracerProvider();
    };
    return TraceAPI2;
  })()
);

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js
var trace = TraceAPI.getInstance();

// node_modules/.pnpm/@opentelemetry+context-zone-peer-dep@2.6.0_@opentelemetry+api@1.9.0_zone.js@0.16.1/node_modules/@opentelemetry/context-zone-peer-dep/build/esm/util.js
function isListenerObject(obj) {
  return typeof obj === "object" && obj !== null && "addEventListener" in obj && typeof obj.addEventListener === "function" && "removeEventListener" in obj && typeof obj.removeEventListener === "function";
}

// node_modules/.pnpm/@opentelemetry+context-zone-peer-dep@2.6.0_@opentelemetry+api@1.9.0_zone.js@0.16.1/node_modules/@opentelemetry/context-zone-peer-dep/build/esm/ZoneContextManager.js
var ZONE_CONTEXT_KEY = "OT_ZONE_CONTEXT";
var ZoneContextManager = class {
  /**
   * whether the context manager is enabled or not
   */
  _enabled = false;
  /**
   * @param context A context (span) to be executed within target function
   * @param target Function to be executed within the context
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  _bindFunction(context2, target) {
    const manager = this;
    const contextWrapper = function(...args) {
      return manager.with(context2, () => target.apply(this, args));
    };
    Object.defineProperty(contextWrapper, "length", {
      enumerable: false,
      configurable: true,
      writable: false,
      value: target.length
    });
    return contextWrapper;
  }
  /**
   * @param context A context (span) to be bind to target
   * @param obj target object on which the listeners will be patched
   */
  _bindListener(context2, obj) {
    const target = obj;
    if (target.__ot_listeners !== void 0) {
      return obj;
    }
    target.__ot_listeners = {};
    if (typeof target.addEventListener === "function") {
      target.addEventListener = this._patchAddEventListener(target, target.addEventListener, context2);
    }
    if (typeof target.removeEventListener === "function") {
      target.removeEventListener = this._patchRemoveEventListener(target, target.removeEventListener);
    }
    return obj;
  }
  /**
   * Creates a new zone
   * @param zoneName zone name
   * @param context A context (span) to be bind with Zone
   */
  _createZone(zoneName, context2) {
    return Zone.current.fork({
      name: zoneName,
      properties: {
        [ZONE_CONTEXT_KEY]: context2
      }
    });
  }
  /**
   * Patches addEventListener method
   * @param target any target that has "addEventListener" method
   * @param original reference to the patched method
   * @param [context] context to be bind to the listener
   */
  _patchAddEventListener(target, original, context2) {
    const contextManager = this;
    return function(event, listener, opts) {
      if (target.__ot_listeners === void 0) {
        target.__ot_listeners = {};
      }
      let listeners = target.__ot_listeners[event];
      if (listeners === void 0) {
        listeners = /* @__PURE__ */ new WeakMap();
        target.__ot_listeners[event] = listeners;
      }
      const patchedListener = contextManager.bind(context2, listener);
      listeners.set(listener, patchedListener);
      return original.call(this, event, patchedListener, opts);
    };
  }
  /**
   * Patches removeEventListener method
   * @param target any target that has "removeEventListener" method
   * @param original reference to the patched method
   */
  _patchRemoveEventListener(target, original) {
    return function(event, listener) {
      if (target.__ot_listeners === void 0 || target.__ot_listeners[event] === void 0) {
        return original.call(this, event, listener);
      }
      const events = target.__ot_listeners[event];
      const patchedListener = events.get(listener);
      events.delete(listener);
      return original.call(this, event, patchedListener || listener);
    };
  }
  /**
   * Returns the active context
   */
  active() {
    if (!this._enabled || !Zone.current) {
      return ROOT_CONTEXT;
    }
    return Zone.current.get(ZONE_CONTEXT_KEY) || ROOT_CONTEXT;
  }
  /**
   * Binds a the certain context or the active one to the target function and then returns the target
   * @param context A context (span) to be bind to target
   * @param target a function or event emitter. When target or one of its callbacks is called,
   *  the provided context will be used as the active context for the duration of the call.
   */
  bind(context2, target) {
    if (typeof target === "function") {
      return this._bindFunction(context2, target);
    } else if (isListenerObject(target)) {
      this._bindListener(context2, target);
    }
    return target;
  }
  /**
   * Disable the context manager (clears all the contexts)
   */
  disable() {
    this._enabled = false;
    return this;
  }
  /**
   * Enables the context manager and creates a default(root) context
   */
  enable() {
    this._enabled = true;
    return this;
  }
  /**
   * Calls the callback function [fn] with the provided [context].
   *     If [context] is undefined then it will use the active context.
   *     The context will be set as active
   * @param context A context (span) to be called with provided callback
   * @param fn Callback function
   * @param thisArg optional receiver to be used for calling fn
   * @param args optional arguments forwarded to fn
   */
  with(context2, fn, thisArg, ...args) {
    let zoneName = "otel:with";
    if (fn.name) {
      zoneName += `:${fn.name}`;
    }
    return this._createZone(zoneName, context2).run(fn, thisArg, args);
  }
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js
var SUPPRESS_TRACING_KEY = createContextKey("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function isTracingSuppressed(context2) {
  return context2.getValue(SUPPRESS_TRACING_KEY) === true;
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/constants.js
var BAGGAGE_KEY_PAIR_SEPARATOR = "=";
var BAGGAGE_PROPERTIES_SEPARATOR = ";";
var BAGGAGE_ITEMS_SEPARATOR = ",";
var BAGGAGE_HEADER = "baggage";
var BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
var BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
var BAGGAGE_MAX_TOTAL_LENGTH = 8192;

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/utils.js
function serializeKeyPairs(keyPairs) {
  return keyPairs.reduce((hValue, current) => {
    const value = `${hValue}${hValue !== "" ? BAGGAGE_ITEMS_SEPARATOR : ""}${current}`;
    return value.length > BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
  }, "");
}
function getKeyPairs(baggage) {
  return baggage.getAllEntries().map(([key, value]) => {
    let entry = `${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`;
    if (value.metadata !== void 0) {
      entry += BAGGAGE_PROPERTIES_SEPARATOR + value.metadata.toString();
    }
    return entry;
  });
}
function parsePairKeyValue(entry) {
  if (!entry)
    return;
  const metadataSeparatorIndex = entry.indexOf(BAGGAGE_PROPERTIES_SEPARATOR);
  const keyPairPart = metadataSeparatorIndex === -1 ? entry : entry.substring(0, metadataSeparatorIndex);
  const separatorIndex = keyPairPart.indexOf(BAGGAGE_KEY_PAIR_SEPARATOR);
  if (separatorIndex <= 0)
    return;
  const rawKey = keyPairPart.substring(0, separatorIndex).trim();
  const rawValue = keyPairPart.substring(separatorIndex + 1).trim();
  if (!rawKey || !rawValue)
    return;
  let key;
  let value;
  try {
    key = decodeURIComponent(rawKey);
    value = decodeURIComponent(rawValue);
  } catch {
    return;
  }
  let metadata2;
  if (metadataSeparatorIndex !== -1 && metadataSeparatorIndex < entry.length - 1) {
    const metadataString = entry.substring(metadataSeparatorIndex + 1);
    metadata2 = baggageEntryMetadataFromString(metadataString);
  }
  return { key, value, metadata: metadata2 };
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/baggage/propagation/W3CBaggagePropagator.js
var W3CBaggagePropagator = class {
  inject(context2, carrier, setter) {
    const baggage = propagation.getBaggage(context2);
    if (!baggage || isTracingSuppressed(context2))
      return;
    const keyPairs = getKeyPairs(baggage).filter((pair) => {
      return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
    }).slice(0, BAGGAGE_MAX_NAME_VALUE_PAIRS);
    const headerValue = serializeKeyPairs(keyPairs);
    if (headerValue.length > 0) {
      setter.set(carrier, BAGGAGE_HEADER, headerValue);
    }
  }
  extract(context2, carrier, getter) {
    const headerValue = getter.get(carrier, BAGGAGE_HEADER);
    const baggageString = Array.isArray(headerValue) ? headerValue.join(BAGGAGE_ITEMS_SEPARATOR) : headerValue;
    if (!baggageString)
      return context2;
    const baggage = {};
    if (baggageString.length === 0) {
      return context2;
    }
    const pairs = baggageString.split(BAGGAGE_ITEMS_SEPARATOR);
    pairs.forEach((entry) => {
      const keyPair = parsePairKeyValue(entry);
      if (keyPair) {
        const baggageEntry = { value: keyPair.value };
        if (keyPair.metadata) {
          baggageEntry.metadata = keyPair.metadata;
        }
        baggage[keyPair.key] = baggageEntry;
      }
    });
    if (Object.entries(baggage).length === 0) {
      return context2;
    }
    return propagation.setBaggage(context2, propagation.createBaggage(baggage));
  }
  fields() {
    return [BAGGAGE_HEADER];
  }
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/attributes.js
function sanitizeAttributes(attributes) {
  const out = {};
  if (typeof attributes !== "object" || attributes == null) {
    return out;
  }
  for (const key in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, key)) {
      continue;
    }
    if (!isAttributeKey(key)) {
      diag2.warn(`Invalid attribute key: ${key}`);
      continue;
    }
    const val = attributes[key];
    if (!isAttributeValue(val)) {
      diag2.warn(`Invalid attribute value set for key: ${key}`);
      continue;
    }
    if (Array.isArray(val)) {
      out[key] = val.slice();
    } else {
      out[key] = val;
    }
  }
  return out;
}
function isAttributeKey(key) {
  return typeof key === "string" && key !== "";
}
function isAttributeValue(val) {
  if (val == null) {
    return true;
  }
  if (Array.isArray(val)) {
    return isHomogeneousAttributeValueArray(val);
  }
  return isValidPrimitiveAttributeValueType(typeof val);
}
function isHomogeneousAttributeValueArray(arr) {
  let type;
  for (const element of arr) {
    if (element == null)
      continue;
    const elementType = typeof element;
    if (elementType === type) {
      continue;
    }
    if (!type) {
      if (isValidPrimitiveAttributeValueType(elementType)) {
        type = elementType;
        continue;
      }
      return false;
    }
    return false;
  }
  return true;
}
function isValidPrimitiveAttributeValueType(valType) {
  switch (valType) {
    case "number":
    case "boolean":
    case "string":
      return true;
  }
  return false;
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/logging-error-handler.js
function loggingErrorHandler() {
  return (ex) => {
    diag2.error(stringifyException(ex));
  };
}
function stringifyException(ex) {
  if (typeof ex === "string") {
    return ex;
  } else {
    return JSON.stringify(flattenException(ex));
  }
}
function flattenException(ex) {
  const result = {};
  let current = ex;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach((propertyName) => {
      if (result[propertyName])
        return;
      const value = current[propertyName];
      if (value) {
        result[propertyName] = String(value);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return result;
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js
var delegateHandler = loggingErrorHandler();
function globalErrorHandler(ex) {
  try {
    delegateHandler(ex);
  } catch {
  }
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/environment.js
function getStringFromEnv(_2) {
  return void 0;
}
function getNumberFromEnv(_2) {
  return void 0;
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/version.js
var VERSION2 = "2.6.0";

// node_modules/.pnpm/@opentelemetry+semantic-conventions@1.40.0/node_modules/@opentelemetry/semantic-conventions/build/esm/stable_attributes.js
var ATTR_ERROR_TYPE = "error.type";
var ATTR_EXCEPTION_MESSAGE = "exception.message";
var ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
var ATTR_EXCEPTION_TYPE = "exception.type";
var ATTR_HTTP_REQUEST_METHOD = "http.request.method";
var ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
var ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
var ATTR_SERVER_ADDRESS = "server.address";
var ATTR_SERVER_PORT = "server.port";
var ATTR_SERVICE_NAME = "service.name";
var ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
var TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
var ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
var ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
var ATTR_URL_FULL = "url.full";
var ATTR_USER_AGENT_ORIGINAL = "user_agent.original";

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/semconv.js
var ATTR_PROCESS_RUNTIME_NAME = "process.runtime.name";

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/sdk-info.js
var SDK_INFO = {
  [ATTR_TELEMETRY_SDK_NAME]: "opentelemetry",
  [ATTR_PROCESS_RUNTIME_NAME]: "browser",
  [ATTR_TELEMETRY_SDK_LANGUAGE]: TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS,
  [ATTR_TELEMETRY_SDK_VERSION]: VERSION2
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/index.js
var otperformance = performance;

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/time.js
var NANOSECOND_DIGITS = 9;
var NANOSECOND_DIGITS_IN_MILLIS = 6;
var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
function millisToHrTime(epochMillis) {
  const epochSeconds = epochMillis / 1e3;
  const seconds = Math.trunc(epochSeconds);
  const nanos = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS);
  return [seconds, nanos];
}
function hrTime(performanceNow) {
  const timeOrigin = millisToHrTime(otperformance.timeOrigin);
  const now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now());
  return addHrTimes(timeOrigin, now);
}
function hrTimeDuration(startTime, endTime) {
  let seconds = endTime[0] - startTime[0];
  let nanos = endTime[1] - startTime[1];
  if (nanos < 0) {
    seconds -= 1;
    nanos += SECOND_TO_NANOSECONDS;
  }
  return [seconds, nanos];
}
function isTimeInputHrTime(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function isTimeInput(value) {
  return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
function addHrTimes(time1, time2) {
  const out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS) {
    out[1] -= SECOND_TO_NANOSECONDS;
    out[0] += 1;
  }
  return out;
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/propagation/composite.js
var CompositePropagator = class {
  _propagators;
  _fields;
  /**
   * Construct a composite propagator from a list of propagators.
   *
   * @param [config] Configuration object for composite propagator
   */
  constructor(config = {}) {
    this._propagators = config.propagators ?? [];
    this._fields = Array.from(new Set(this._propagators.map((p2) => typeof p2.fields === "function" ? p2.fields() : []).reduce((x2, y2) => x2.concat(y2), [])));
  }
  /**
   * Run each of the configured propagators with the given context and carrier.
   * Propagators are run in the order they are configured, so if multiple
   * propagators write the same carrier key, the propagator later in the list
   * will "win".
   *
   * @param context Context to inject
   * @param carrier Carrier into which context will be injected
   */
  inject(context2, carrier, setter) {
    for (const propagator of this._propagators) {
      try {
        propagator.inject(context2, carrier, setter);
      } catch (err) {
        diag2.warn(`Failed to inject with ${propagator.constructor.name}. Err: ${err.message}`);
      }
    }
  }
  /**
   * Run each of the configured propagators with the given context and carrier.
   * Propagators are run in the order they are configured, so if multiple
   * propagators write the same context key, the propagator later in the list
   * will "win".
   *
   * @param context Context to add values to
   * @param carrier Carrier from which to extract context
   */
  extract(context2, carrier, getter) {
    return this._propagators.reduce((ctx, propagator) => {
      try {
        return propagator.extract(ctx, carrier, getter);
      } catch (err) {
        diag2.warn(`Failed to extract with ${propagator.constructor.name}. Err: ${err.message}`);
      }
      return ctx;
    }, context2);
  }
  fields() {
    return this._fields.slice();
  }
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/internal/validators.js
var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
var VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
var VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
var VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/TraceState.js
var MAX_TRACE_STATE_ITEMS = 32;
var MAX_TRACE_STATE_LEN = 512;
var LIST_MEMBERS_SEPARATOR = ",";
var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
var TraceState = class _TraceState {
  _internalState = /* @__PURE__ */ new Map();
  constructor(rawTraceState) {
    if (rawTraceState)
      this._parse(rawTraceState);
  }
  set(key, value) {
    const traceState = this._clone();
    if (traceState._internalState.has(key)) {
      traceState._internalState.delete(key);
    }
    traceState._internalState.set(key, value);
    return traceState;
  }
  unset(key) {
    const traceState = this._clone();
    traceState._internalState.delete(key);
    return traceState;
  }
  get(key) {
    return this._internalState.get(key);
  }
  serialize() {
    return this._keys().reduce((agg, key) => {
      agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
      return agg;
    }, []).join(LIST_MEMBERS_SEPARATOR);
  }
  _parse(rawTraceState) {
    if (rawTraceState.length > MAX_TRACE_STATE_LEN)
      return;
    this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce((agg, part) => {
      const listMember = part.trim();
      const i2 = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
      if (i2 !== -1) {
        const key = listMember.slice(0, i2);
        const value = listMember.slice(i2 + 1, part.length);
        if (validateKey(key) && validateValue(value)) {
          agg.set(key, value);
        } else {
        }
      }
      return agg;
    }, /* @__PURE__ */ new Map());
    if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
      this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
    }
  }
  _keys() {
    return Array.from(this._internalState.keys()).reverse();
  }
  _clone() {
    const traceState = new _TraceState();
    traceState._internalState = new Map(this._internalState);
    return traceState;
  }
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/trace/W3CTraceContextPropagator.js
var TRACE_PARENT_HEADER = "traceparent";
var TRACE_STATE_HEADER = "tracestate";
var VERSION3 = "00";
var VERSION_PART = "(?!ff)[\\da-f]{2}";
var TRACE_ID_PART = "(?![0]{32})[\\da-f]{32}";
var PARENT_ID_PART = "(?![0]{16})[\\da-f]{16}";
var FLAGS_PART = "[\\da-f]{2}";
var TRACE_PARENT_REGEX = new RegExp(`^\\s?(${VERSION_PART})-(${TRACE_ID_PART})-(${PARENT_ID_PART})-(${FLAGS_PART})(-.*)?\\s?$`);
function parseTraceParent(traceParent) {
  const match = TRACE_PARENT_REGEX.exec(traceParent);
  if (!match)
    return null;
  if (match[1] === "00" && match[5])
    return null;
  return {
    traceId: match[2],
    spanId: match[3],
    traceFlags: parseInt(match[4], 16)
  };
}
var W3CTraceContextPropagator = class {
  inject(context2, carrier, setter) {
    const spanContext = trace.getSpanContext(context2);
    if (!spanContext || isTracingSuppressed(context2) || !isSpanContextValid(spanContext))
      return;
    const traceParent = `${VERSION3}-${spanContext.traceId}-${spanContext.spanId}-0${Number(spanContext.traceFlags || TraceFlags.NONE).toString(16)}`;
    setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
    if (spanContext.traceState) {
      setter.set(carrier, TRACE_STATE_HEADER, spanContext.traceState.serialize());
    }
  }
  extract(context2, carrier, getter) {
    const traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
    if (!traceParentHeader)
      return context2;
    const traceParent = Array.isArray(traceParentHeader) ? traceParentHeader[0] : traceParentHeader;
    if (typeof traceParent !== "string")
      return context2;
    const spanContext = parseTraceParent(traceParent);
    if (!spanContext)
      return context2;
    spanContext.isRemote = true;
    const traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
    if (traceStateHeader) {
      const state2 = Array.isArray(traceStateHeader) ? traceStateHeader.join(",") : traceStateHeader;
      spanContext.traceState = new TraceState(typeof state2 === "string" ? state2 : void 0);
    }
    return trace.setSpanContext(context2, spanContext);
  }
  fields() {
    return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
  }
};

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/lodash.merge.js
var objectTag = "[object Object]";
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var funcProto = Function.prototype;
var funcToString = funcProto.toString;
var objectCtorString = funcToString.call(Object);
var getPrototypeOf = Object.getPrototypeOf;
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
var nativeObjectToString = objectProto.toString;
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
    return false;
  }
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function getRawTag(value) {
  const isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  let unmasked = false;
  try {
    value[symToStringTag] = void 0;
    unmasked = true;
  } catch {
  }
  const result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
function objectToString(value) {
  return nativeObjectToString.call(value);
}

// node_modules/.pnpm/@opentelemetry+core@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/merge.js
var MAX_LEVEL = 20;
function merge(...args) {
  let result = args.shift();
  const objects = /* @__PURE__ */ new WeakMap();
  while (args.length > 0) {
    result = mergeTwoObjects(result, args.shift(), 0, objects);
  }
  return result;
}
function takeValue(value) {
  if (isArray(value)) {
    return value.slice();
  }
  return value;
}
function mergeTwoObjects(one, two, level = 0, objects) {
  let result;
  if (level > MAX_LEVEL) {
    return void 0;
  }
  level++;
  if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
    result = takeValue(two);
  } else if (isArray(one)) {
    result = one.slice();
    if (isArray(two)) {
      for (let i2 = 0, j = two.length; i2 < j; i2++) {
        result.push(takeValue(two[i2]));
      }
    } else if (isObject(two)) {
      const keys = Object.keys(two);
      for (let i2 = 0, j = keys.length; i2 < j; i2++) {
        const key = keys[i2];
        result[key] = takeValue(two[key]);
      }
    }
  } else if (isObject(one)) {
    if (isObject(two)) {
      if (!shouldMerge(one, two)) {
        return two;
      }
      result = Object.assign({}, one);
      const keys = Object.keys(two);
      for (let i2 = 0, j = keys.length; i2 < j; i2++) {
        const key = keys[i2];
        const twoValue = two[key];
        if (isPrimitive(twoValue)) {
          if (typeof twoValue === "undefined") {
            delete result[key];
          } else {
            result[key] = twoValue;
          }
        } else {
          const obj1 = result[key];
          const obj2 = twoValue;
          if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
            delete result[key];
          } else {
            if (isObject(obj1) && isObject(obj2)) {
              const arr1 = objects.get(obj1) || [];
              const arr2 = objects.get(obj2) || [];
              arr1.push({ obj: one, key });
              arr2.push({ obj: two, key });
              objects.set(obj1, arr1);
              objects.set(obj2, arr2);
            }
            result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
          }
        }
      }
    } else {
      result = two;
    }
  }
  return result;
}
function wasObjectReferenced(obj, key, objects) {
  const arr = objects.get(obj[key]) || [];
  for (let i2 = 0, j = arr.length; i2 < j; i2++) {
    const info = arr[i2];
    if (info.key === key && info.obj === obj) {
      return true;
    }
  }
  return false;
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
  if (!isPlainObject(one) || !isPlainObject(two)) {
    return false;
  }
  return true;
}

// node_modules/.pnpm/@opentelemetry+resources@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/default-service-name.js
var serviceName;
function defaultServiceName() {
  if (serviceName === void 0) {
    try {
      const argv0 = globalThis.process.argv0;
      serviceName = argv0 ? `unknown_service:${argv0}` : "unknown_service";
    } catch {
      serviceName = "unknown_service";
    }
  }
  return serviceName;
}

// node_modules/.pnpm/@opentelemetry+resources@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/utils.js
var isPromiseLike = (val) => {
  return val !== null && typeof val === "object" && typeof val.then === "function";
};

// node_modules/.pnpm/@opentelemetry+resources@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js
var ResourceImpl = class _ResourceImpl {
  _rawAttributes;
  _asyncAttributesPending = false;
  _schemaUrl;
  _memoizedAttributes;
  static FromAttributeList(attributes, options) {
    const res = new _ResourceImpl({}, options);
    res._rawAttributes = guardedRawAttributes(attributes);
    res._asyncAttributesPending = attributes.filter(([_2, val]) => isPromiseLike(val)).length > 0;
    return res;
  }
  constructor(resource, options) {
    const attributes = resource.attributes ?? {};
    this._rawAttributes = Object.entries(attributes).map(([k2, v2]) => {
      if (isPromiseLike(v2)) {
        this._asyncAttributesPending = true;
      }
      return [k2, v2];
    });
    this._rawAttributes = guardedRawAttributes(this._rawAttributes);
    this._schemaUrl = validateSchemaUrl(options?.schemaUrl);
  }
  get asyncAttributesPending() {
    return this._asyncAttributesPending;
  }
  async waitForAsyncAttributes() {
    if (!this.asyncAttributesPending) {
      return;
    }
    for (let i2 = 0; i2 < this._rawAttributes.length; i2++) {
      const [k2, v2] = this._rawAttributes[i2];
      this._rawAttributes[i2] = [k2, isPromiseLike(v2) ? await v2 : v2];
    }
    this._asyncAttributesPending = false;
  }
  get attributes() {
    if (this.asyncAttributesPending) {
      diag2.error("Accessing resource attributes before async attributes settled");
    }
    if (this._memoizedAttributes) {
      return this._memoizedAttributes;
    }
    const attrs = {};
    for (const [k2, v2] of this._rawAttributes) {
      if (isPromiseLike(v2)) {
        diag2.debug(`Unsettled resource attribute ${k2} skipped`);
        continue;
      }
      if (v2 != null) {
        attrs[k2] ??= v2;
      }
    }
    if (!this._asyncAttributesPending) {
      this._memoizedAttributes = attrs;
    }
    return attrs;
  }
  getRawAttributes() {
    return this._rawAttributes;
  }
  get schemaUrl() {
    return this._schemaUrl;
  }
  merge(resource) {
    if (resource == null)
      return this;
    const mergedSchemaUrl = mergeSchemaUrl(this, resource);
    const mergedOptions = mergedSchemaUrl ? { schemaUrl: mergedSchemaUrl } : void 0;
    return _ResourceImpl.FromAttributeList([...resource.getRawAttributes(), ...this.getRawAttributes()], mergedOptions);
  }
};
function resourceFromAttributes(attributes, options) {
  return ResourceImpl.FromAttributeList(Object.entries(attributes), options);
}
function defaultResource() {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]: defaultServiceName(),
    [ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
    [ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
    [ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION]
  });
}
function guardedRawAttributes(attributes) {
  return attributes.map(([k2, v2]) => {
    if (isPromiseLike(v2)) {
      return [
        k2,
        v2.catch((err) => {
          diag2.debug("promise rejection for resource attribute: %s - %s", k2, err);
          return void 0;
        })
      ];
    }
    return [k2, v2];
  });
}
function validateSchemaUrl(schemaUrl) {
  if (typeof schemaUrl === "string" || schemaUrl === void 0) {
    return schemaUrl;
  }
  diag2.warn("Schema URL must be string or undefined, got %s. Schema URL will be ignored.", schemaUrl);
  return void 0;
}
function mergeSchemaUrl(old, updating) {
  const oldSchemaUrl = old?.schemaUrl;
  const updatingSchemaUrl = updating?.schemaUrl;
  const isOldEmpty = oldSchemaUrl === void 0 || oldSchemaUrl === "";
  const isUpdatingEmpty = updatingSchemaUrl === void 0 || updatingSchemaUrl === "";
  if (isOldEmpty) {
    return updatingSchemaUrl;
  }
  if (isUpdatingEmpty) {
    return oldSchemaUrl;
  }
  if (oldSchemaUrl === updatingSchemaUrl) {
    return oldSchemaUrl;
  }
  diag2.warn('Schema URL merge conflict: old resource has "%s", updating resource has "%s". Resulting resource will have undefined Schema URL.', oldSchemaUrl, updatingSchemaUrl);
  return void 0;
}

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/enums.js
var ExceptionEventName = "exception";

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
var SpanImpl = class {
  // Below properties are included to implement ReadableSpan for export
  // purposes but are not intended to be written-to directly.
  _spanContext;
  kind;
  parentSpanContext;
  attributes = {};
  links = [];
  events = [];
  startTime;
  resource;
  instrumentationScope;
  _droppedAttributesCount = 0;
  _droppedEventsCount = 0;
  _droppedLinksCount = 0;
  _attributesCount = 0;
  name;
  status = {
    code: SpanStatusCode.UNSET
  };
  endTime = [0, 0];
  _ended = false;
  _duration = [-1, -1];
  _spanProcessor;
  _spanLimits;
  _attributeValueLengthLimit;
  _recordEndMetrics;
  _performanceStartTime;
  _performanceOffset;
  _startTimeProvided;
  /**
   * Constructs a new SpanImpl instance.
   */
  constructor(opts) {
    const now = Date.now();
    this._spanContext = opts.spanContext;
    this._performanceStartTime = otperformance.now();
    this._performanceOffset = now - (this._performanceStartTime + otperformance.timeOrigin);
    this._startTimeProvided = opts.startTime != null;
    this._spanLimits = opts.spanLimits;
    this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit || 0;
    this._spanProcessor = opts.spanProcessor;
    this.name = opts.name;
    this.parentSpanContext = opts.parentSpanContext;
    this.kind = opts.kind;
    this.links = opts.links || [];
    this.startTime = this._getTime(opts.startTime ?? now);
    this.resource = opts.resource;
    this.instrumentationScope = opts.scope;
    this._recordEndMetrics = opts.recordEndMetrics;
    if (opts.attributes != null) {
      this.setAttributes(opts.attributes);
    }
    this._spanProcessor.onStart(this, opts.context);
  }
  spanContext() {
    return this._spanContext;
  }
  setAttribute(key, value) {
    if (value == null || this._isSpanEnded())
      return this;
    if (key.length === 0) {
      diag2.warn(`Invalid attribute key: ${key}`);
      return this;
    }
    if (!isAttributeValue(value)) {
      diag2.warn(`Invalid attribute value set for key: ${key}`);
      return this;
    }
    const { attributeCountLimit } = this._spanLimits;
    const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (attributeCountLimit !== void 0 && this._attributesCount >= attributeCountLimit && isNewKey) {
      this._droppedAttributesCount++;
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    if (isNewKey) {
      this._attributesCount++;
    }
    return this;
  }
  setAttributes(attributes) {
    for (const [k2, v2] of Object.entries(attributes)) {
      this.setAttribute(k2, v2);
    }
    return this;
  }
  /**
   *
   * @param name Span Name
   * @param [attributesOrStartTime] Span attributes or start time
   *     if type is {@type TimeInput} and 3rd param is undefined
   * @param [timeStamp] Specified time stamp for the event
   */
  addEvent(name, attributesOrStartTime, timeStamp) {
    if (this._isSpanEnded())
      return this;
    const { eventCountLimit } = this._spanLimits;
    if (eventCountLimit === 0) {
      diag2.warn("No events allowed.");
      this._droppedEventsCount++;
      return this;
    }
    if (eventCountLimit !== void 0 && this.events.length >= eventCountLimit) {
      if (this._droppedEventsCount === 0) {
        diag2.debug("Dropping extra events.");
      }
      this.events.shift();
      this._droppedEventsCount++;
    }
    if (isTimeInput(attributesOrStartTime)) {
      if (!isTimeInput(timeStamp)) {
        timeStamp = attributesOrStartTime;
      }
      attributesOrStartTime = void 0;
    }
    const attributes = sanitizeAttributes(attributesOrStartTime);
    this.events.push({
      name,
      attributes,
      time: this._getTime(timeStamp),
      droppedAttributesCount: 0
    });
    return this;
  }
  addLink(link) {
    this.links.push(link);
    return this;
  }
  addLinks(links) {
    this.links.push(...links);
    return this;
  }
  setStatus(status) {
    if (this._isSpanEnded())
      return this;
    this.status = { ...status };
    if (this.status.message != null && typeof status.message !== "string") {
      diag2.warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
      delete this.status.message;
    }
    return this;
  }
  updateName(name) {
    if (this._isSpanEnded())
      return this;
    this.name = name;
    return this;
  }
  end(endTime) {
    if (this._isSpanEnded()) {
      diag2.error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
      return;
    }
    this.endTime = this._getTime(endTime);
    this._duration = hrTimeDuration(this.startTime, this.endTime);
    if (this._duration[0] < 0) {
      diag2.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
      this.endTime = this.startTime.slice();
      this._duration = [0, 0];
    }
    if (this._droppedEventsCount > 0) {
      diag2.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
    }
    if (this._spanProcessor.onEnding) {
      this._spanProcessor.onEnding(this);
    }
    this._recordEndMetrics?.();
    this._ended = true;
    this._spanProcessor.onEnd(this);
  }
  _getTime(inp) {
    if (typeof inp === "number" && inp <= otperformance.now()) {
      return hrTime(inp + this._performanceOffset);
    }
    if (typeof inp === "number") {
      return millisToHrTime(inp);
    }
    if (inp instanceof Date) {
      return millisToHrTime(inp.getTime());
    }
    if (isTimeInputHrTime(inp)) {
      return inp;
    }
    if (this._startTimeProvided) {
      return millisToHrTime(Date.now());
    }
    const msDuration = otperformance.now() - this._performanceStartTime;
    return addHrTimes(this.startTime, millisToHrTime(msDuration));
  }
  isRecording() {
    return this._ended === false;
  }
  recordException(exception, time) {
    const attributes = {};
    if (typeof exception === "string") {
      attributes[ATTR_EXCEPTION_MESSAGE] = exception;
    } else if (exception) {
      if (exception.code) {
        attributes[ATTR_EXCEPTION_TYPE] = exception.code.toString();
      } else if (exception.name) {
        attributes[ATTR_EXCEPTION_TYPE] = exception.name;
      }
      if (exception.message) {
        attributes[ATTR_EXCEPTION_MESSAGE] = exception.message;
      }
      if (exception.stack) {
        attributes[ATTR_EXCEPTION_STACKTRACE] = exception.stack;
      }
    }
    if (attributes[ATTR_EXCEPTION_TYPE] || attributes[ATTR_EXCEPTION_MESSAGE]) {
      this.addEvent(ExceptionEventName, attributes, time);
    } else {
      diag2.warn(`Failed to record an exception ${exception}`);
    }
  }
  get duration() {
    return this._duration;
  }
  get ended() {
    return this._ended;
  }
  get droppedAttributesCount() {
    return this._droppedAttributesCount;
  }
  get droppedEventsCount() {
    return this._droppedEventsCount;
  }
  get droppedLinksCount() {
    return this._droppedLinksCount;
  }
  _isSpanEnded() {
    if (this._ended) {
      const error = new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
      diag2.warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error);
    }
    return this._ended;
  }
  // Utility function to truncate given value within size
  // for value type of string, will truncate to given limit
  // for type of non-string, will return same value
  _truncateToLimitUtil(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  }
  /**
   * If the given attribute value is of type string and has more characters than given {@code attributeValueLengthLimit} then
   * return string with truncated to {@code attributeValueLengthLimit} characters
   *
   * If the given attribute value is array of strings then
   * return new array of strings with each element truncated to {@code attributeValueLengthLimit} characters
   *
   * Otherwise return same Attribute {@code value}
   *
   * @param value Attribute value
   * @returns truncated attribute value if required, otherwise same value
   */
  _truncateToSize(value) {
    const limit = this._attributeValueLengthLimit;
    if (limit <= 0) {
      diag2.warn(`Attribute value limit must be positive, got ${limit}`);
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (Array.isArray(value)) {
      return value.map((val) => typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val);
    }
    return value;
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Sampler.js
var SamplingDecision2;
(function(SamplingDecision3) {
  SamplingDecision3[SamplingDecision3["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision3[SamplingDecision3["RECORD"] = 1] = "RECORD";
  SamplingDecision3[SamplingDecision3["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision2 || (SamplingDecision2 = {}));

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
var AlwaysOffSampler = class {
  shouldSample() {
    return {
      decision: SamplingDecision2.NOT_RECORD
    };
  }
  toString() {
    return "AlwaysOffSampler";
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOnSampler.js
var AlwaysOnSampler = class {
  shouldSample() {
    return {
      decision: SamplingDecision2.RECORD_AND_SAMPLED
    };
  }
  toString() {
    return "AlwaysOnSampler";
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/ParentBasedSampler.js
var ParentBasedSampler = class {
  _root;
  _remoteParentSampled;
  _remoteParentNotSampled;
  _localParentSampled;
  _localParentNotSampled;
  constructor(config) {
    this._root = config.root;
    if (!this._root) {
      globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
      this._root = new AlwaysOnSampler();
    }
    this._remoteParentSampled = config.remoteParentSampled ?? new AlwaysOnSampler();
    this._remoteParentNotSampled = config.remoteParentNotSampled ?? new AlwaysOffSampler();
    this._localParentSampled = config.localParentSampled ?? new AlwaysOnSampler();
    this._localParentNotSampled = config.localParentNotSampled ?? new AlwaysOffSampler();
  }
  shouldSample(context2, traceId, spanName, spanKind, attributes, links) {
    const parentContext = trace.getSpanContext(context2);
    if (!parentContext || !isSpanContextValid(parentContext)) {
      return this._root.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.isRemote) {
      if (parentContext.traceFlags & TraceFlags.SAMPLED) {
        return this._remoteParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
      }
      return this._remoteParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
    }
    if (parentContext.traceFlags & TraceFlags.SAMPLED) {
      return this._localParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
    }
    return this._localParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes, links);
  }
  toString() {
    return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/TraceIdRatioBasedSampler.js
var TraceIdRatioBasedSampler = class {
  _ratio;
  _upperBound;
  constructor(ratio = 0) {
    this._ratio = this._normalize(ratio);
    this._upperBound = Math.floor(this._ratio * 4294967295);
  }
  shouldSample(context2, traceId) {
    return {
      decision: isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision2.RECORD_AND_SAMPLED : SamplingDecision2.NOT_RECORD
    };
  }
  toString() {
    return `TraceIdRatioBased{${this._ratio}}`;
  }
  _normalize(ratio) {
    if (typeof ratio !== "number" || isNaN(ratio))
      return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  }
  _accumulate(traceId) {
    let accumulation = 0;
    for (let i2 = 0; i2 < traceId.length / 8; i2++) {
      const pos = i2 * 8;
      const part = parseInt(traceId.slice(pos, pos + 8), 16);
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var TracesSamplerValues;
(function(TracesSamplerValues2) {
  TracesSamplerValues2["AlwaysOff"] = "always_off";
  TracesSamplerValues2["AlwaysOn"] = "always_on";
  TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
  TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
  TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
  TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));
var DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  return {
    sampler: buildSamplerFromEnv(),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? 128
    },
    spanLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? 128,
      linkCountLimit: getNumberFromEnv("OTEL_SPAN_LINK_COUNT_LIMIT") ?? 128,
      eventCountLimit: getNumberFromEnv("OTEL_SPAN_EVENT_COUNT_LIMIT") ?? 128,
      attributePerEventCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT") ?? 128,
      attributePerLinkCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT") ?? 128
    }
  };
}
function buildSamplerFromEnv() {
  const sampler = getStringFromEnv("OTEL_TRACES_SAMPLER") ?? TracesSamplerValues.ParentBasedAlwaysOn;
  switch (sampler) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler();
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler();
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler()
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv());
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv())
      });
    default:
      diag2.error(`OTEL_TRACES_SAMPLER value "${sampler}" invalid, defaulting to "${TracesSamplerValues.ParentBasedAlwaysOn}".`);
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
  }
}
function getSamplerProbabilityFromEnv() {
  const probability = getNumberFromEnv("OTEL_TRACES_SAMPLER_ARG");
  if (probability == null) {
    diag2.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    diag2.error(`OTEL_TRACES_SAMPLER_ARG=${probability} was given, but it is out of range ([0..1]), defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  return probability;
}

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/utility.js
var DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
var DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
function mergeConfig(userConfig) {
  const perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  const DEFAULT_CONFIG = loadDefaultConfig();
  const target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  const spanLimits = Object.assign({}, userConfig.spanLimits);
  spanLimits.attributeCountLimit = userConfig.spanLimits?.attributeCountLimit ?? userConfig.generalLimits?.attributeCountLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = userConfig.spanLimits?.attributeValueLengthLimit ?? userConfig.generalLimits?.attributeValueLengthLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/RandomIdGenerator.js
var TRACE_ID_BYTES = 16;
var SPAN_ID_BYTES = 8;
var TRACE_BUFFER = new Uint8Array(TRACE_ID_BYTES);
var SPAN_BUFFER = new Uint8Array(SPAN_ID_BYTES);
var HEX = Array.from({ length: 256 }, (_2, i2) => i2.toString(16).padStart(2, "0"));
function randomFill(buf) {
  for (let i2 = 0; i2 < buf.length; i2++) {
    buf[i2] = Math.random() * 256 >>> 0;
  }
  for (let i2 = 0; i2 < buf.length; i2++) {
    if (buf[i2] > 0)
      return;
  }
  buf[buf.length - 1] = 1;
}
function toHex(buf) {
  let hex = "";
  for (let i2 = 0; i2 < buf.length; i2++) {
    hex += HEX[buf[i2]];
  }
  return hex;
}
var RandomIdGenerator = class {
  /**
   * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
   * characters corresponding to 128 bits.
   */
  generateTraceId() {
    randomFill(TRACE_BUFFER);
    return toHex(TRACE_BUFFER);
  }
  /**
   * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
   * characters corresponding to 64 bits.
   */
  generateSpanId() {
    randomFill(SPAN_BUFFER);
    return toHex(SPAN_BUFFER);
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/semconv.js
var ATTR_OTEL_SPAN_PARENT_ORIGIN = "otel.span.parent.origin";
var ATTR_OTEL_SPAN_SAMPLING_RESULT = "otel.span.sampling_result";
var METRIC_OTEL_SDK_SPAN_LIVE = "otel.sdk.span.live";
var METRIC_OTEL_SDK_SPAN_STARTED = "otel.sdk.span.started";

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/TracerMetrics.js
var TracerMetrics = class {
  startedSpans;
  liveSpans;
  constructor(meter) {
    this.startedSpans = meter.createCounter(METRIC_OTEL_SDK_SPAN_STARTED, {
      unit: "{span}",
      description: "The number of created spans."
    });
    this.liveSpans = meter.createUpDownCounter(METRIC_OTEL_SDK_SPAN_LIVE, {
      unit: "{span}",
      description: "The number of currently live spans."
    });
  }
  startSpan(parentSpanCtx, samplingDecision) {
    const samplingDecisionStr = samplingDecisionToString(samplingDecision);
    this.startedSpans.add(1, {
      [ATTR_OTEL_SPAN_PARENT_ORIGIN]: parentOrigin(parentSpanCtx),
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    });
    if (samplingDecision === SamplingDecision2.NOT_RECORD) {
      return () => {
      };
    }
    const liveSpanAttributes = {
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    };
    this.liveSpans.add(1, liveSpanAttributes);
    return () => {
      this.liveSpans.add(-1, liveSpanAttributes);
    };
  }
};
function parentOrigin(parentSpanContext) {
  if (!parentSpanContext) {
    return "none";
  }
  if (parentSpanContext.isRemote) {
    return "remote";
  }
  return "local";
}
function samplingDecisionToString(decision) {
  switch (decision) {
    case SamplingDecision2.RECORD_AND_SAMPLED:
      return "RECORD_AND_SAMPLE";
    case SamplingDecision2.RECORD:
      return "RECORD_ONLY";
    case SamplingDecision2.NOT_RECORD:
      return "DROP";
  }
}

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/version.js
var VERSION4 = "2.6.0";

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
var Tracer = class {
  _sampler;
  _generalLimits;
  _spanLimits;
  _idGenerator;
  instrumentationScope;
  _resource;
  _spanProcessor;
  _tracerMetrics;
  /**
   * Constructs a new Tracer instance.
   */
  constructor(instrumentationScope, config, resource, spanProcessor) {
    const localConfig = mergeConfig(config);
    this._sampler = localConfig.sampler;
    this._generalLimits = localConfig.generalLimits;
    this._spanLimits = localConfig.spanLimits;
    this._idGenerator = config.idGenerator || new RandomIdGenerator();
    this._resource = resource;
    this._spanProcessor = spanProcessor;
    this.instrumentationScope = instrumentationScope;
    const meter = localConfig.meterProvider ? localConfig.meterProvider.getMeter("@opentelemetry/sdk-trace", VERSION4) : createNoopMeter();
    this._tracerMetrics = new TracerMetrics(meter);
  }
  /**
   * Starts a new Span or returns the default NoopSpan based on the sampling
   * decision.
   */
  startSpan(name, options = {}, context2 = context.active()) {
    if (options.root) {
      context2 = trace.deleteSpan(context2);
    }
    const parentSpan = trace.getSpan(context2);
    if (isTracingSuppressed(context2)) {
      diag2.debug("Instrumentation suppressed, returning Noop Span");
      const nonRecordingSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
      return nonRecordingSpan;
    }
    const parentSpanContext = parentSpan?.spanContext();
    const spanId = this._idGenerator.generateSpanId();
    let validParentSpanContext;
    let traceId;
    let traceState;
    if (!parentSpanContext || !trace.isSpanContextValid(parentSpanContext)) {
      traceId = this._idGenerator.generateTraceId();
    } else {
      traceId = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      validParentSpanContext = parentSpanContext;
    }
    const spanKind = options.kind ?? SpanKind.INTERNAL;
    const links = (options.links ?? []).map((link) => {
      return {
        context: link.context,
        attributes: sanitizeAttributes(link.attributes)
      };
    });
    const attributes = sanitizeAttributes(options.attributes);
    const samplingResult = this._sampler.shouldSample(context2, traceId, name, spanKind, attributes, links);
    const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
    traceState = samplingResult.traceState ?? traceState;
    const traceFlags = samplingResult.decision === SamplingDecision.RECORD_AND_SAMPLED ? TraceFlags.SAMPLED : TraceFlags.NONE;
    const spanContext = { traceId, spanId, traceFlags, traceState };
    if (samplingResult.decision === SamplingDecision.NOT_RECORD) {
      diag2.debug("Recording is off, propagating context in a non-recording span");
      const nonRecordingSpan = trace.wrapSpanContext(spanContext);
      return nonRecordingSpan;
    }
    const initAttributes = sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
    const span = new SpanImpl({
      resource: this._resource,
      scope: this.instrumentationScope,
      context: context2,
      spanContext,
      name,
      kind: spanKind,
      links,
      parentSpanContext: validParentSpanContext,
      attributes: initAttributes,
      startTime: options.startTime,
      spanProcessor: this._spanProcessor,
      spanLimits: this._spanLimits,
      recordEndMetrics
    });
    return span;
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx ?? context.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = trace.setSpan(parentContext, span);
    return context.with(contextWithSpanSet, fn, void 0, span);
  }
  /** Returns the active {@link GeneralLimits}. */
  getGeneralLimits() {
    return this._generalLimits;
  }
  /** Returns the active {@link SpanLimits}. */
  getSpanLimits() {
    return this._spanLimits;
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/MultiSpanProcessor.js
var MultiSpanProcessor = class {
  _spanProcessors;
  constructor(spanProcessors) {
    this._spanProcessors = spanProcessors;
  }
  forceFlush() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.forceFlush());
    }
    return new Promise((resolve) => {
      Promise.all(promises).then(() => {
        resolve();
      }).catch((error) => {
        globalErrorHandler(error || new Error("MultiSpanProcessor: forceFlush failed"));
        resolve();
      });
    });
  }
  onStart(span, context2) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onStart(span, context2);
    }
  }
  onEnding(span) {
    for (const spanProcessor of this._spanProcessors) {
      if (spanProcessor.onEnding) {
        spanProcessor.onEnding(span);
      }
    }
  }
  onEnd(span) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onEnd(span);
    }
  }
  shutdown() {
    const promises = [];
    for (const spanProcessor of this._spanProcessors) {
      promises.push(spanProcessor.shutdown());
    }
    return new Promise((resolve, reject) => {
      Promise.all(promises).then(() => {
        resolve();
      }, reject);
    });
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
var BasicTracerProvider = class {
  _config;
  _tracers = /* @__PURE__ */ new Map();
  _resource;
  _activeSpanProcessor;
  constructor(config = {}) {
    const mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
    this._resource = mergedConfig.resource ?? defaultResource();
    this._config = Object.assign({}, mergedConfig, {
      resource: this._resource
    });
    const spanProcessors = [];
    if (config.spanProcessors?.length) {
      spanProcessors.push(...config.spanProcessors);
    }
    this._activeSpanProcessor = new MultiSpanProcessor(spanProcessors);
  }
  getTracer(name, version, options) {
    const key = `${name}@${version || ""}:${options?.schemaUrl || ""}`;
    if (!this._tracers.has(key)) {
      this._tracers.set(key, new Tracer({ name, version, schemaUrl: options?.schemaUrl }, this._config, this._resource, this._activeSpanProcessor));
    }
    return this._tracers.get(key);
  }
  forceFlush() {
    const timeout = this._config.forceFlushTimeoutMillis;
    const promises = this._activeSpanProcessor["_spanProcessors"].map((spanProcessor) => {
      return new Promise((resolve) => {
        let state2;
        const timeoutInterval = setTimeout(() => {
          resolve(new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
          state2 = ForceFlushState.timeout;
        }, timeout);
        spanProcessor.forceFlush().then(() => {
          clearTimeout(timeoutInterval);
          if (state2 !== ForceFlushState.timeout) {
            state2 = ForceFlushState.resolved;
            resolve(state2);
          }
        }).catch((error) => {
          clearTimeout(timeoutInterval);
          state2 = ForceFlushState.error;
          resolve(error);
        });
      });
    });
    return new Promise((resolve, reject) => {
      Promise.all(promises).then((results) => {
        const errors = results.filter((result) => result !== ForceFlushState.resolved);
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve();
        }
      }).catch((error) => reject([error]));
    });
  }
  shutdown() {
    return this._activeSpanProcessor.shutdown();
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/StackContextManager.js
var StackContextManager = class {
  /**
   * whether the context manager is enabled or not
   */
  _enabled = false;
  /**
   * Keeps the reference to current context
   */
  _currentContext = ROOT_CONTEXT;
  /**
   *
   * @param context
   * @param target Function to be executed within the context
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  _bindFunction(context2 = ROOT_CONTEXT, target) {
    const manager = this;
    const contextWrapper = function(...args) {
      return manager.with(context2, () => target.apply(this, args));
    };
    Object.defineProperty(contextWrapper, "length", {
      enumerable: false,
      configurable: true,
      writable: false,
      value: target.length
    });
    return contextWrapper;
  }
  /**
   * Returns the active context
   */
  active() {
    return this._currentContext;
  }
  /**
   * Binds a the certain context or the active one to the target function and then returns the target
   * @param context A context (span) to be bind to target
   * @param target a function or event emitter. When target or one of its callbacks is called,
   *  the provided context will be used as the active context for the duration of the call.
   */
  bind(context2, target) {
    if (context2 === void 0) {
      context2 = this.active();
    }
    if (typeof target === "function") {
      return this._bindFunction(context2, target);
    }
    return target;
  }
  /**
   * Disable the context manager (clears the current context)
   */
  disable() {
    this._currentContext = ROOT_CONTEXT;
    this._enabled = false;
    return this;
  }
  /**
   * Enables the context manager and creates a default(root) context
   */
  enable() {
    if (this._enabled) {
      return this;
    }
    this._enabled = true;
    this._currentContext = ROOT_CONTEXT;
    return this;
  }
  /**
   * Calls the callback function [fn] with the provided [context]. If [context] is undefined then it will use the window.
   * The context will be set as active
   * @param context
   * @param fn Callback function
   * @param thisArg optional receiver to be used for calling fn
   * @param args optional arguments forwarded to fn
   */
  with(context2, fn, thisArg, ...args) {
    const previousContext = this._currentContext;
    this._currentContext = context2 || ROOT_CONTEXT;
    try {
      return fn.call(thisArg, ...args);
    } finally {
      this._currentContext = previousContext;
    }
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/WebTracerProvider.js
function setupContextManager(contextManager) {
  if (contextManager === null) {
    return;
  }
  if (contextManager === void 0) {
    const defaultContextManager = new StackContextManager();
    defaultContextManager.enable();
    context.setGlobalContextManager(defaultContextManager);
    return;
  }
  contextManager.enable();
  context.setGlobalContextManager(contextManager);
}
function setupPropagator(propagator) {
  if (propagator === null) {
    return;
  }
  if (propagator === void 0) {
    propagation.setGlobalPropagator(new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator()
      ]
    }));
    return;
  }
  propagation.setGlobalPropagator(propagator);
}
var WebTracerProvider = class extends BasicTracerProvider {
  /**
   * Constructs a new Tracer instance.
   * @param config Web Tracer config
   */
  constructor(config = {}) {
    super(config);
  }
  /**
   * Register this TracerProvider for use with the OpenTelemetry API.
   * Undefined values may be replaced with defaults, and
   * null values will be skipped.
   *
   * @param config Configuration object for SDK registration
   */
  register(config = {}) {
    trace.setGlobalTracerProvider(this);
    setupPropagator(config.propagator);
    setupContextManager(config.contextManager);
  }
};

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/enums/PerformanceTimingNames.js
var PerformanceTimingNames;
(function(PerformanceTimingNames3) {
  PerformanceTimingNames3["CONNECT_END"] = "connectEnd";
  PerformanceTimingNames3["CONNECT_START"] = "connectStart";
  PerformanceTimingNames3["DECODED_BODY_SIZE"] = "decodedBodySize";
  PerformanceTimingNames3["DOM_COMPLETE"] = "domComplete";
  PerformanceTimingNames3["DOM_CONTENT_LOADED_EVENT_END"] = "domContentLoadedEventEnd";
  PerformanceTimingNames3["DOM_CONTENT_LOADED_EVENT_START"] = "domContentLoadedEventStart";
  PerformanceTimingNames3["DOM_INTERACTIVE"] = "domInteractive";
  PerformanceTimingNames3["DOMAIN_LOOKUP_END"] = "domainLookupEnd";
  PerformanceTimingNames3["DOMAIN_LOOKUP_START"] = "domainLookupStart";
  PerformanceTimingNames3["ENCODED_BODY_SIZE"] = "encodedBodySize";
  PerformanceTimingNames3["FETCH_START"] = "fetchStart";
  PerformanceTimingNames3["LOAD_EVENT_END"] = "loadEventEnd";
  PerformanceTimingNames3["LOAD_EVENT_START"] = "loadEventStart";
  PerformanceTimingNames3["NAVIGATION_START"] = "navigationStart";
  PerformanceTimingNames3["REDIRECT_END"] = "redirectEnd";
  PerformanceTimingNames3["REDIRECT_START"] = "redirectStart";
  PerformanceTimingNames3["REQUEST_START"] = "requestStart";
  PerformanceTimingNames3["RESPONSE_END"] = "responseEnd";
  PerformanceTimingNames3["RESPONSE_START"] = "responseStart";
  PerformanceTimingNames3["SECURE_CONNECTION_START"] = "secureConnectionStart";
  PerformanceTimingNames3["START_TIME"] = "startTime";
  PerformanceTimingNames3["UNLOAD_EVENT_END"] = "unloadEventEnd";
  PerformanceTimingNames3["UNLOAD_EVENT_START"] = "unloadEventStart";
})(PerformanceTimingNames || (PerformanceTimingNames = {}));

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/semconv.js
var ATTR_HTTP_RESPONSE_CONTENT_LENGTH = "http.response_content_length";
var ATTR_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = "http.response_content_length_uncompressed";

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.6.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/utils.js
function hasKey(obj, key) {
  return key in obj;
}
function addSpanNetworkEvent(span, performanceName, entries, ignoreZeros = true) {
  if (hasKey(entries, performanceName) && typeof entries[performanceName] === "number" && !(ignoreZeros && entries[performanceName] === 0)) {
    return span.addEvent(performanceName, entries[performanceName]);
  }
  return void 0;
}
function addSpanNetworkEvents(span, resource, ignoreNetworkEvents = false, ignoreZeros, skipOldSemconvContentLengthAttrs) {
  if (ignoreZeros === void 0) {
    ignoreZeros = resource[PerformanceTimingNames.START_TIME] !== 0;
  }
  if (!ignoreNetworkEvents) {
    addSpanNetworkEvent(span, PerformanceTimingNames.FETCH_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.DOMAIN_LOOKUP_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.DOMAIN_LOOKUP_END, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.CONNECT_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.SECURE_CONNECTION_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.CONNECT_END, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.REQUEST_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.RESPONSE_START, resource, ignoreZeros);
    addSpanNetworkEvent(span, PerformanceTimingNames.RESPONSE_END, resource, ignoreZeros);
  }
  if (!skipOldSemconvContentLengthAttrs) {
    const encodedLength = resource[PerformanceTimingNames.ENCODED_BODY_SIZE];
    if (encodedLength !== void 0) {
      span.setAttribute(ATTR_HTTP_RESPONSE_CONTENT_LENGTH, encodedLength);
    }
    const decodedLength = resource[PerformanceTimingNames.DECODED_BODY_SIZE];
    if (decodedLength !== void 0 && encodedLength !== decodedLength) {
      span.setAttribute(ATTR_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED, decodedLength);
    }
  }
}

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLogger.js
var NoopLogger = class {
  emit(_logRecord) {
  }
};
var NOOP_LOGGER = new NoopLogger();

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLoggerProvider.js
var NoopLoggerProvider = class {
  getLogger(_name, _version, _options) {
    return new NoopLogger();
  }
};
var NOOP_LOGGER_PROVIDER = new NoopLoggerProvider();

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLogger.js
var ProxyLogger = class {
  constructor(_provider, name, version, options) {
    this._provider = _provider;
    this.name = name;
    this.version = version;
    this.options = options;
  }
  /**
   * Emit a log record. This method should only be used by log appenders.
   *
   * @param logRecord
   */
  emit(logRecord) {
    this._getLogger().emit(logRecord);
  }
  /**
   * Try to get a logger from the proxy logger provider.
   * If the proxy logger provider has no delegate, return a noop logger.
   */
  _getLogger() {
    if (this._delegate) {
      return this._delegate;
    }
    const logger3 = this._provider._getDelegateLogger(this.name, this.version, this.options);
    if (!logger3) {
      return NOOP_LOGGER;
    }
    this._delegate = logger3;
    return this._delegate;
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLoggerProvider.js
var ProxyLoggerProvider = class {
  getLogger(name, version, options) {
    var _a;
    return (_a = this._getDelegateLogger(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyLogger(this, name, version, options);
  }
  /**
   * Get the delegate logger provider.
   * Used by tests only.
   * @internal
   */
  _getDelegate() {
    var _a;
    return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_LOGGER_PROVIDER;
  }
  /**
   * Set the delegate logger provider
   * @internal
   */
  _setDelegate(delegate) {
    this._delegate = delegate;
  }
  /**
   * @internal
   */
  _getDelegateLogger(name, version, options) {
    var _a;
    return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getLogger(name, version, options);
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/platform/browser/globalThis.js
var _globalThis3 = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/internal/global-utils.js
var GLOBAL_LOGS_API_KEY = Symbol.for("io.opentelemetry.js.api.logs");
var _global2 = _globalThis3;
function makeGetter(requiredVersion, instance, fallback) {
  return (version) => version === requiredVersion ? instance : fallback;
}
var API_BACKWARDS_COMPATIBILITY_VERSION = 1;

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/api/logs.js
var LogsAPI = class _LogsAPI {
  constructor() {
    this._proxyLoggerProvider = new ProxyLoggerProvider();
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new _LogsAPI();
    }
    return this._instance;
  }
  setGlobalLoggerProvider(provider) {
    if (_global2[GLOBAL_LOGS_API_KEY]) {
      return this.getLoggerProvider();
    }
    _global2[GLOBAL_LOGS_API_KEY] = makeGetter(API_BACKWARDS_COMPATIBILITY_VERSION, provider, NOOP_LOGGER_PROVIDER);
    this._proxyLoggerProvider._setDelegate(provider);
    return provider;
  }
  /**
   * Returns the global logger provider.
   *
   * @returns LoggerProvider
   */
  getLoggerProvider() {
    var _a, _b;
    return (_b = (_a = _global2[GLOBAL_LOGS_API_KEY]) === null || _a === void 0 ? void 0 : _a.call(_global2, API_BACKWARDS_COMPATIBILITY_VERSION)) !== null && _b !== void 0 ? _b : this._proxyLoggerProvider;
  }
  /**
   * Returns a logger from the global logger provider.
   *
   * @returns Logger
   */
  getLogger(name, version, options) {
    return this.getLoggerProvider().getLogger(name, version, options);
  }
  /** Remove the global logger provider */
  disable() {
    delete _global2[GLOBAL_LOGS_API_KEY];
    this._proxyLoggerProvider = new ProxyLoggerProvider();
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.208.0/node_modules/@opentelemetry/api-logs/build/esm/index.js
var logs = LogsAPI.getInstance();

// node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/shimmer.js
var logger = console.error.bind(console);
function defineProperty(obj, name, value) {
  const enumerable = !!obj[name] && Object.prototype.propertyIsEnumerable.call(obj, name);
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable,
    writable: true,
    value
  });
}
var wrap = (nodule, name, wrapper) => {
  if (!nodule || !nodule[name]) {
    logger("no original function " + String(name) + " to wrap");
    return;
  }
  if (!wrapper) {
    logger("no wrapper function");
    logger(new Error().stack);
    return;
  }
  const original = nodule[name];
  if (typeof original !== "function" || typeof wrapper !== "function") {
    logger("original object and wrapper must be functions");
    return;
  }
  const wrapped = wrapper(original, name);
  defineProperty(wrapped, "__original", original);
  defineProperty(wrapped, "__unwrap", () => {
    if (nodule[name] === wrapped) {
      defineProperty(nodule, name, original);
    }
  });
  defineProperty(wrapped, "__wrapped", true);
  defineProperty(nodule, name, wrapped);
  return wrapped;
};
var massWrap = (nodules, names, wrapper) => {
  if (!nodules) {
    logger("must provide one or more modules to patch");
    logger(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger("must provide one or more functions to wrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      wrap(nodule, name, wrapper);
    });
  });
};
var unwrap = (nodule, name) => {
  if (!nodule || !nodule[name]) {
    logger("no function to unwrap.");
    logger(new Error().stack);
    return;
  }
  const wrapped = nodule[name];
  if (!wrapped.__unwrap) {
    logger("no original to unwrap to -- has " + String(name) + " already been unwrapped?");
  } else {
    wrapped.__unwrap();
    return;
  }
};
var massUnwrap = (nodules, names) => {
  if (!nodules) {
    logger("must provide one or more modules to patch");
    logger(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger("must provide one or more functions to unwrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      unwrap(nodule, name);
    });
  });
};
function shimmer(options) {
  if (options && options.logger) {
    if (typeof options.logger !== "function") {
      logger("new logger isn't a function, not replacing");
    } else {
      logger = options.logger;
    }
  }
}
shimmer.wrap = wrap;
shimmer.massWrap = massWrap;
shimmer.unwrap = unwrap;
shimmer.massUnwrap = massUnwrap;

// node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/instrumentation.js
var InstrumentationAbstract = class {
  instrumentationName;
  instrumentationVersion;
  _config = {};
  _tracer;
  _meter;
  _logger;
  _diag;
  constructor(instrumentationName, instrumentationVersion, config) {
    this.instrumentationName = instrumentationName;
    this.instrumentationVersion = instrumentationVersion;
    this.setConfig(config);
    this._diag = diag2.createComponentLogger({
      namespace: instrumentationName
    });
    this._tracer = trace.getTracer(instrumentationName, instrumentationVersion);
    this._meter = metrics.getMeter(instrumentationName, instrumentationVersion);
    this._logger = logs.getLogger(instrumentationName, instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Api to wrap instrumented method */
  _wrap = wrap;
  /* Api to unwrap instrumented methods */
  _unwrap = unwrap;
  /* Api to mass wrap instrumented method */
  _massWrap = massWrap;
  /* Api to mass unwrap instrumented methods */
  _massUnwrap = massUnwrap;
  /* Returns meter */
  get meter() {
    return this._meter;
  }
  /**
   * Sets MeterProvider to this plugin
   * @param meterProvider
   */
  setMeterProvider(meterProvider) {
    this._meter = meterProvider.getMeter(this.instrumentationName, this.instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Returns logger */
  get logger() {
    return this._logger;
  }
  /**
   * Sets LoggerProvider to this plugin
   * @param loggerProvider
   */
  setLoggerProvider(loggerProvider) {
    this._logger = loggerProvider.getLogger(this.instrumentationName, this.instrumentationVersion);
  }
  /**
   * @experimental
   *
   * Get module definitions defined by {@link init}.
   * This can be used for experimental compile-time instrumentation.
   *
   * @returns an array of {@link InstrumentationModuleDefinition}
   */
  getModuleDefinitions() {
    const initResult = this.init() ?? [];
    if (!Array.isArray(initResult)) {
      return [initResult];
    }
    return initResult;
  }
  /**
   * Sets the new metric instruments with the current Meter.
   */
  _updateMetricInstruments() {
    return;
  }
  /* Returns InstrumentationConfig */
  getConfig() {
    return this._config;
  }
  /**
   * Sets InstrumentationConfig to this plugin
   * @param config
   */
  setConfig(config) {
    this._config = {
      enabled: true,
      ...config
    };
  }
  /**
   * Sets TraceProvider to this plugin
   * @param tracerProvider
   */
  setTracerProvider(tracerProvider) {
    this._tracer = tracerProvider.getTracer(this.instrumentationName, this.instrumentationVersion);
  }
  /* Returns tracer */
  get tracer() {
    return this._tracer;
  }
  /**
   * Execute span customization hook, if configured, and log any errors.
   * Any semantics of the trigger and info are defined by the specific instrumentation.
   * @param hookHandler The optional hook handler which the user has configured via instrumentation config
   * @param triggerName The name of the trigger for executing the hook for logging purposes
   * @param span The span to which the hook should be applied
   * @param info The info object to be passed to the hook, with useful data the hook may use
   */
  _runSpanCustomizationHook(hookHandler, triggerName, span, info) {
    if (!hookHandler) {
      return;
    }
    try {
      hookHandler(span, info);
    } catch (e2) {
      this._diag.error(`Error running span customization hook due to exception in handler`, { triggerName }, e2);
    }
  }
};

// node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/browser/instrumentation.js
var InstrumentationBase = class extends InstrumentationAbstract {
  constructor(instrumentationName, instrumentationVersion, config) {
    super(instrumentationName, instrumentationVersion, config);
    if (this._config.enabled) {
      this.enable();
    }
  }
};

// node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/utils.js
function safeExecuteInTheMiddle(execute, onFinish, preventThrowingError) {
  let error;
  let result;
  try {
    result = execute();
  } catch (e2) {
    error = e2;
  } finally {
    onFinish(error, result);
    if (error && !preventThrowingError) {
      throw error;
    }
    return result;
  }
}

// node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/semconvStability.js
var SemconvStability;
(function(SemconvStability3) {
  SemconvStability3[SemconvStability3["STABLE"] = 1] = "STABLE";
  SemconvStability3[SemconvStability3["OLD"] = 2] = "OLD";
  SemconvStability3[SemconvStability3["DUPLICATE"] = 3] = "DUPLICATE";
})(SemconvStability || (SemconvStability = {}));
function semconvStabilityFromStr(namespace, str) {
  let semconvStability = SemconvStability.OLD;
  const entries = str?.split(",").map((v2) => v2.trim()).filter((s2) => s2 !== "");
  for (const entry of entries ?? []) {
    if (entry.toLowerCase() === namespace + "/dup") {
      semconvStability = SemconvStability.DUPLICATE;
      break;
    } else if (entry.toLowerCase() === namespace) {
      semconvStability = SemconvStability.STABLE;
    }
  }
  return semconvStability;
}

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/enums/AttributeNames.js
var AttributeNames;
(function(AttributeNames3) {
  AttributeNames3["DOCUMENT_LOAD"] = "documentLoad";
  AttributeNames3["DOCUMENT_FETCH"] = "documentFetch";
  AttributeNames3["RESOURCE_FETCH"] = "resourceFetch";
})(AttributeNames || (AttributeNames = {}));

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/version.js
var PACKAGE_VERSION = "0.54.0";
var PACKAGE_NAME = "@opentelemetry/instrumentation-document-load";

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/semconv.js
var ATTR_HTTP_URL = "http.url";
var ATTR_HTTP_USER_AGENT = "http.user_agent";

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/enums/EventNames.js
var EventNames;
(function(EventNames2) {
  EventNames2["FIRST_PAINT"] = "firstPaint";
  EventNames2["FIRST_CONTENTFUL_PAINT"] = "firstContentfulPaint";
})(EventNames || (EventNames = {}));

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/utils.js
var getPerformanceNavigationEntries = () => {
  const entries = {};
  const performanceNavigationTiming = otperformance.getEntriesByType?.("navigation")[0];
  if (performanceNavigationTiming) {
    const keys = Object.values(PerformanceTimingNames);
    keys.forEach((key) => {
      if (hasKey(performanceNavigationTiming, key)) {
        const value = performanceNavigationTiming[key];
        if (typeof value === "number") {
          entries[key] = value;
        }
      }
    });
  } else {
    const perf = otperformance;
    const performanceTiming = perf.timing;
    if (performanceTiming) {
      const keys = Object.values(PerformanceTimingNames);
      keys.forEach((key) => {
        if (hasKey(performanceTiming, key)) {
          const value = performanceTiming[key];
          if (typeof value === "number") {
            entries[key] = value;
          }
        }
      });
    }
  }
  return entries;
};
var performancePaintNames = {
  "first-paint": EventNames.FIRST_PAINT,
  "first-contentful-paint": EventNames.FIRST_CONTENTFUL_PAINT
};
var addSpanPerformancePaintEvents = (span) => {
  const performancePaintTiming = otperformance.getEntriesByType?.("paint");
  if (performancePaintTiming) {
    performancePaintTiming.forEach(({ name, startTime }) => {
      if (hasKey(performancePaintNames, name)) {
        span.addEvent(performancePaintNames[name], startTime);
      }
    });
  }
};

// node_modules/.pnpm/@opentelemetry+instrumentation-document-load@0.54.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-document-load/build/esm/instrumentation.js
var DocumentLoadInstrumentation = class extends InstrumentationBase {
  component = "document-load";
  version = "1";
  moduleName = this.component;
  _semconvStability;
  constructor(config = {}) {
    super(PACKAGE_NAME, PACKAGE_VERSION, config);
    this._semconvStability = semconvStabilityFromStr("http", config?.semconvStabilityOptIn);
  }
  init() {
  }
  /**
   * callback to be executed when page is loaded
   */
  _onDocumentLoaded() {
    window.setTimeout(() => {
      this._collectPerformance();
    });
  }
  /**
   * Adds spans for all resources
   * @param rootSpan
   */
  _addResourcesSpans(rootSpan) {
    const resources = otperformance.getEntriesByType?.("resource");
    if (resources) {
      resources.forEach((resource) => {
        this._initResourceSpan(resource, rootSpan);
      });
    }
  }
  /**
   * Collects information about performance and creates appropriate spans
   */
  _collectPerformance() {
    const metaElement = Array.from(document.getElementsByTagName("meta")).find((e2) => e2.getAttribute("name") === TRACE_PARENT_HEADER);
    const entries = getPerformanceNavigationEntries();
    const traceparent = metaElement && metaElement.content || "";
    context.with(propagation.extract(ROOT_CONTEXT, { traceparent }), () => {
      const rootSpan = this._startSpan(AttributeNames.DOCUMENT_LOAD, PerformanceTimingNames.FETCH_START, entries);
      if (!rootSpan) {
        return;
      }
      context.with(trace.setSpan(context.active(), rootSpan), () => {
        const fetchSpan = this._startSpan(AttributeNames.DOCUMENT_FETCH, PerformanceTimingNames.FETCH_START, entries);
        if (fetchSpan) {
          if (this._semconvStability & SemconvStability.OLD) {
            fetchSpan.setAttribute(ATTR_HTTP_URL, location.href);
          }
          if (this._semconvStability & SemconvStability.STABLE) {
            fetchSpan.setAttribute(ATTR_URL_FULL, location.href);
          }
          context.with(trace.setSpan(context.active(), fetchSpan), () => {
            const skipOldSemconvContentLengthAttrs = !(this._semconvStability & SemconvStability.OLD);
            addSpanNetworkEvents(fetchSpan, entries, this.getConfig().ignoreNetworkEvents, void 0, skipOldSemconvContentLengthAttrs);
            this._addCustomAttributesOnSpan(fetchSpan, this.getConfig().applyCustomAttributesOnSpan?.documentFetch);
            this._endSpan(fetchSpan, PerformanceTimingNames.RESPONSE_END, entries);
          });
        }
      });
      if (this._semconvStability & SemconvStability.OLD) {
        rootSpan.setAttribute(ATTR_HTTP_URL, location.href);
        rootSpan.setAttribute(ATTR_HTTP_USER_AGENT, navigator.userAgent);
      }
      if (this._semconvStability & SemconvStability.STABLE) {
        rootSpan.setAttribute(ATTR_URL_FULL, location.href);
        rootSpan.setAttribute(ATTR_USER_AGENT_ORIGINAL, navigator.userAgent);
      }
      this._addResourcesSpans(rootSpan);
      if (!this.getConfig().ignoreNetworkEvents) {
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.FETCH_START, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.UNLOAD_EVENT_START, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.UNLOAD_EVENT_END, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.DOM_INTERACTIVE, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.DOM_CONTENT_LOADED_EVENT_START, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.DOM_CONTENT_LOADED_EVENT_END, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.DOM_COMPLETE, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.LOAD_EVENT_START, entries);
        addSpanNetworkEvent(rootSpan, PerformanceTimingNames.LOAD_EVENT_END, entries);
      }
      if (!this.getConfig().ignorePerformancePaintEvents) {
        addSpanPerformancePaintEvents(rootSpan);
      }
      this._addCustomAttributesOnSpan(rootSpan, this.getConfig().applyCustomAttributesOnSpan?.documentLoad);
      this._endSpan(rootSpan, PerformanceTimingNames.LOAD_EVENT_END, entries);
    });
  }
  /**
   * Helper function for ending span
   * @param span
   * @param performanceName name of performance entry for time end
   * @param entries
   */
  _endSpan(span, performanceName, entries) {
    if (span) {
      if (hasKey(entries, performanceName)) {
        span.end(entries[performanceName]);
      } else {
        span.end();
      }
    }
  }
  /**
   * Creates and ends a span with network information about resource added as timed events
   * @param resource
   * @param parentSpan
   */
  _initResourceSpan(resource, parentSpan) {
    const span = this._startSpan(AttributeNames.RESOURCE_FETCH, PerformanceTimingNames.FETCH_START, resource, parentSpan);
    if (span) {
      if (this._semconvStability & SemconvStability.OLD) {
        span.setAttribute(ATTR_HTTP_URL, resource.name);
      }
      if (this._semconvStability & SemconvStability.STABLE) {
        span.setAttribute(ATTR_URL_FULL, resource.name);
      }
      const skipOldSemconvContentLengthAttrs = !(this._semconvStability & SemconvStability.OLD);
      addSpanNetworkEvents(span, resource, this.getConfig().ignoreNetworkEvents, void 0, skipOldSemconvContentLengthAttrs);
      this._addCustomAttributesOnResourceSpan(span, resource, this.getConfig().applyCustomAttributesOnSpan?.resourceFetch);
      this._endSpan(span, PerformanceTimingNames.RESPONSE_END, resource);
    }
  }
  /**
   * Helper function for starting a span
   * @param spanName name of span
   * @param performanceName name of performance entry for time start
   * @param entries
   * @param parentSpan
   */
  _startSpan(spanName, performanceName, entries, parentSpan) {
    if (hasKey(entries, performanceName) && typeof entries[performanceName] === "number") {
      const span = this.tracer.startSpan(spanName, {
        startTime: entries[performanceName]
      }, parentSpan ? trace.setSpan(context.active(), parentSpan) : void 0);
      return span;
    }
    return void 0;
  }
  /**
   * executes callback {_onDocumentLoaded} when the page is loaded
   */
  _waitForPageLoad() {
    if (window.document.readyState === "complete") {
      this._onDocumentLoaded();
    } else {
      this._onDocumentLoaded = this._onDocumentLoaded.bind(this);
      window.addEventListener("load", this._onDocumentLoaded);
    }
  }
  /**
   * adds custom attributes to root span if configured
   */
  _addCustomAttributesOnSpan(span, applyCustomAttributesOnSpan) {
    if (applyCustomAttributesOnSpan) {
      safeExecuteInTheMiddle(() => applyCustomAttributesOnSpan(span), (error) => {
        if (!error) {
          return;
        }
        this._diag.error("addCustomAttributesOnSpan", error);
      }, true);
    }
  }
  /**
   * adds custom attributes to span if configured
   */
  _addCustomAttributesOnResourceSpan(span, resource, applyCustomAttributesOnSpan) {
    if (applyCustomAttributesOnSpan) {
      safeExecuteInTheMiddle(() => applyCustomAttributesOnSpan(span, resource), (error) => {
        if (!error) {
          return;
        }
        this._diag.error("addCustomAttributesOnResourceSpan", error);
      }, true);
    }
  }
  /**
   * implements enable function
   */
  enable() {
    window.removeEventListener("load", this._onDocumentLoaded);
    this._waitForPageLoad();
  }
  /**
   * implements disable function
   */
  disable() {
    window.removeEventListener("load", this._onDocumentLoaded);
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLogger.js
var NoopLogger2 = class {
  emit(_logRecord) {
  }
};
var NOOP_LOGGER2 = new NoopLogger2();

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLoggerProvider.js
var NoopLoggerProvider2 = class {
  getLogger(_name, _version, _options) {
    return new NoopLogger2();
  }
};
var NOOP_LOGGER_PROVIDER2 = new NoopLoggerProvider2();

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLogger.js
var ProxyLogger2 = class {
  constructor(_provider, name, version, options) {
    this._provider = _provider;
    this.name = name;
    this.version = version;
    this.options = options;
  }
  /**
   * Emit a log record. This method should only be used by log appenders.
   *
   * @param logRecord
   */
  emit(logRecord) {
    this._getLogger().emit(logRecord);
  }
  /**
   * Try to get a logger from the proxy logger provider.
   * If the proxy logger provider has no delegate, return a noop logger.
   */
  _getLogger() {
    if (this._delegate) {
      return this._delegate;
    }
    const logger3 = this._provider._getDelegateLogger(this.name, this.version, this.options);
    if (!logger3) {
      return NOOP_LOGGER2;
    }
    this._delegate = logger3;
    return this._delegate;
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLoggerProvider.js
var ProxyLoggerProvider2 = class {
  getLogger(name, version, options) {
    var _a;
    return (_a = this._getDelegateLogger(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyLogger2(this, name, version, options);
  }
  /**
   * Get the delegate logger provider.
   * Used by tests only.
   * @internal
   */
  _getDelegate() {
    var _a;
    return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_LOGGER_PROVIDER2;
  }
  /**
   * Set the delegate logger provider
   * @internal
   */
  _setDelegate(delegate) {
    this._delegate = delegate;
  }
  /**
   * @internal
   */
  _getDelegateLogger(name, version, options) {
    var _a;
    return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getLogger(name, version, options);
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/platform/browser/globalThis.js
var _globalThis4 = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/internal/global-utils.js
var GLOBAL_LOGS_API_KEY2 = Symbol.for("io.opentelemetry.js.api.logs");
var _global3 = _globalThis4;
function makeGetter2(requiredVersion, instance, fallback) {
  return (version) => version === requiredVersion ? instance : fallback;
}
var API_BACKWARDS_COMPATIBILITY_VERSION2 = 1;

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/api/logs.js
var LogsAPI2 = class _LogsAPI {
  constructor() {
    this._proxyLoggerProvider = new ProxyLoggerProvider2();
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new _LogsAPI();
    }
    return this._instance;
  }
  setGlobalLoggerProvider(provider) {
    if (_global3[GLOBAL_LOGS_API_KEY2]) {
      return this.getLoggerProvider();
    }
    _global3[GLOBAL_LOGS_API_KEY2] = makeGetter2(API_BACKWARDS_COMPATIBILITY_VERSION2, provider, NOOP_LOGGER_PROVIDER2);
    this._proxyLoggerProvider._setDelegate(provider);
    return provider;
  }
  /**
   * Returns the global logger provider.
   *
   * @returns LoggerProvider
   */
  getLoggerProvider() {
    var _a, _b;
    return (_b = (_a = _global3[GLOBAL_LOGS_API_KEY2]) === null || _a === void 0 ? void 0 : _a.call(_global3, API_BACKWARDS_COMPATIBILITY_VERSION2)) !== null && _b !== void 0 ? _b : this._proxyLoggerProvider;
  }
  /**
   * Returns a logger from the global logger provider.
   *
   * @returns Logger
   */
  getLogger(name, version, options) {
    return this.getLoggerProvider().getLogger(name, version, options);
  }
  /** Remove the global logger provider */
  disable() {
    delete _global3[GLOBAL_LOGS_API_KEY2];
    this._proxyLoggerProvider = new ProxyLoggerProvider2();
  }
};

// node_modules/.pnpm/@opentelemetry+api-logs@0.205.0/node_modules/@opentelemetry/api-logs/build/esm/index.js
var logs2 = LogsAPI2.getInstance();

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/autoLoaderUtils.js
function enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider) {
  for (let i2 = 0, j = instrumentations.length; i2 < j; i2++) {
    const instrumentation = instrumentations[i2];
    if (tracerProvider) {
      instrumentation.setTracerProvider(tracerProvider);
    }
    if (meterProvider) {
      instrumentation.setMeterProvider(meterProvider);
    }
    if (loggerProvider && instrumentation.setLoggerProvider) {
      instrumentation.setLoggerProvider(loggerProvider);
    }
    if (!instrumentation.getConfig().enabled) {
      instrumentation.enable();
    }
  }
}
function disableInstrumentations(instrumentations) {
  instrumentations.forEach((instrumentation) => instrumentation.disable());
}

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/autoLoader.js
function registerInstrumentations(options) {
  const tracerProvider = options.tracerProvider || trace.getTracerProvider();
  const meterProvider = options.meterProvider || metrics.getMeterProvider();
  const loggerProvider = options.loggerProvider || logs2.getLoggerProvider();
  const instrumentations = options.instrumentations?.flat() ?? [];
  enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider);
  return () => {
    disableInstrumentations(instrumentations);
  };
}

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/shimmer.js
var logger2 = console.error.bind(console);
function defineProperty2(obj, name, value) {
  const enumerable = !!obj[name] && Object.prototype.propertyIsEnumerable.call(obj, name);
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable,
    writable: true,
    value
  });
}
var wrap2 = (nodule, name, wrapper) => {
  if (!nodule || !nodule[name]) {
    logger2("no original function " + String(name) + " to wrap");
    return;
  }
  if (!wrapper) {
    logger2("no wrapper function");
    logger2(new Error().stack);
    return;
  }
  const original = nodule[name];
  if (typeof original !== "function" || typeof wrapper !== "function") {
    logger2("original object and wrapper must be functions");
    return;
  }
  const wrapped = wrapper(original, name);
  defineProperty2(wrapped, "__original", original);
  defineProperty2(wrapped, "__unwrap", () => {
    if (nodule[name] === wrapped) {
      defineProperty2(nodule, name, original);
    }
  });
  defineProperty2(wrapped, "__wrapped", true);
  defineProperty2(nodule, name, wrapped);
  return wrapped;
};
var massWrap2 = (nodules, names, wrapper) => {
  if (!nodules) {
    logger2("must provide one or more modules to patch");
    logger2(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger2("must provide one or more functions to wrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      wrap2(nodule, name, wrapper);
    });
  });
};
var unwrap2 = (nodule, name) => {
  if (!nodule || !nodule[name]) {
    logger2("no function to unwrap.");
    logger2(new Error().stack);
    return;
  }
  const wrapped = nodule[name];
  if (!wrapped.__unwrap) {
    logger2("no original to unwrap to -- has " + String(name) + " already been unwrapped?");
  } else {
    wrapped.__unwrap();
    return;
  }
};
var massUnwrap2 = (nodules, names) => {
  if (!nodules) {
    logger2("must provide one or more modules to patch");
    logger2(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger2("must provide one or more functions to unwrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      unwrap2(nodule, name);
    });
  });
};
function shimmer2(options) {
  if (options && options.logger) {
    if (typeof options.logger !== "function") {
      logger2("new logger isn't a function, not replacing");
    } else {
      logger2 = options.logger;
    }
  }
}
shimmer2.wrap = wrap2;
shimmer2.massWrap = massWrap2;
shimmer2.unwrap = unwrap2;
shimmer2.massUnwrap = massUnwrap2;

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/instrumentation.js
var InstrumentationAbstract2 = class {
  instrumentationName;
  instrumentationVersion;
  _config = {};
  _tracer;
  _meter;
  _logger;
  _diag;
  constructor(instrumentationName, instrumentationVersion, config) {
    this.instrumentationName = instrumentationName;
    this.instrumentationVersion = instrumentationVersion;
    this.setConfig(config);
    this._diag = diag2.createComponentLogger({
      namespace: instrumentationName
    });
    this._tracer = trace.getTracer(instrumentationName, instrumentationVersion);
    this._meter = metrics.getMeter(instrumentationName, instrumentationVersion);
    this._logger = logs2.getLogger(instrumentationName, instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Api to wrap instrumented method */
  _wrap = wrap2;
  /* Api to unwrap instrumented methods */
  _unwrap = unwrap2;
  /* Api to mass wrap instrumented method */
  _massWrap = massWrap2;
  /* Api to mass unwrap instrumented methods */
  _massUnwrap = massUnwrap2;
  /* Returns meter */
  get meter() {
    return this._meter;
  }
  /**
   * Sets MeterProvider to this plugin
   * @param meterProvider
   */
  setMeterProvider(meterProvider) {
    this._meter = meterProvider.getMeter(this.instrumentationName, this.instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Returns logger */
  get logger() {
    return this._logger;
  }
  /**
   * Sets LoggerProvider to this plugin
   * @param loggerProvider
   */
  setLoggerProvider(loggerProvider) {
    this._logger = loggerProvider.getLogger(this.instrumentationName, this.instrumentationVersion);
  }
  /**
   * @experimental
   *
   * Get module definitions defined by {@link init}.
   * This can be used for experimental compile-time instrumentation.
   *
   * @returns an array of {@link InstrumentationModuleDefinition}
   */
  getModuleDefinitions() {
    const initResult = this.init() ?? [];
    if (!Array.isArray(initResult)) {
      return [initResult];
    }
    return initResult;
  }
  /**
   * Sets the new metric instruments with the current Meter.
   */
  _updateMetricInstruments() {
    return;
  }
  /* Returns InstrumentationConfig */
  getConfig() {
    return this._config;
  }
  /**
   * Sets InstrumentationConfig to this plugin
   * @param config
   */
  setConfig(config) {
    this._config = {
      enabled: true,
      ...config
    };
  }
  /**
   * Sets TraceProvider to this plugin
   * @param tracerProvider
   */
  setTracerProvider(tracerProvider) {
    this._tracer = tracerProvider.getTracer(this.instrumentationName, this.instrumentationVersion);
  }
  /* Returns tracer */
  get tracer() {
    return this._tracer;
  }
  /**
   * Execute span customization hook, if configured, and log any errors.
   * Any semantics of the trigger and info are defined by the specific instrumentation.
   * @param hookHandler The optional hook handler which the user has configured via instrumentation config
   * @param triggerName The name of the trigger for executing the hook for logging purposes
   * @param span The span to which the hook should be applied
   * @param info The info object to be passed to the hook, with useful data the hook may use
   */
  _runSpanCustomizationHook(hookHandler, triggerName, span, info) {
    if (!hookHandler) {
      return;
    }
    try {
      hookHandler(span, info);
    } catch (e2) {
      this._diag.error(`Error running span customization hook due to exception in handler`, { triggerName }, e2);
    }
  }
};

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/browser/instrumentation.js
var InstrumentationBase2 = class extends InstrumentationAbstract2 {
  constructor(instrumentationName, instrumentationVersion, config) {
    super(instrumentationName, instrumentationVersion, config);
    if (this._config.enabled) {
      this.enable();
    }
  }
};

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/utils.js
function safeExecuteInTheMiddle2(execute, onFinish, preventThrowingError) {
  let error;
  let result;
  try {
    result = execute();
  } catch (e2) {
    error = e2;
  } finally {
    onFinish(error, result);
    if (error && !preventThrowingError) {
      throw error;
    }
    return result;
  }
}
function isWrapped2(func) {
  return typeof func === "function" && typeof func.__original === "function" && typeof func.__unwrap === "function" && func.__wrapped === true;
}

// node_modules/.pnpm/@opentelemetry+instrumentation@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/semconvStability.js
var SemconvStability2;
(function(SemconvStability3) {
  SemconvStability3[SemconvStability3["STABLE"] = 1] = "STABLE";
  SemconvStability3[SemconvStability3["OLD"] = 2] = "OLD";
  SemconvStability3[SemconvStability3["DUPLICATE"] = 3] = "DUPLICATE";
})(SemconvStability2 || (SemconvStability2 = {}));
function semconvStabilityFromStr2(namespace, str) {
  let semconvStability = SemconvStability2.OLD;
  const entries = str?.split(",").map((v2) => v2.trim()).filter((s2) => s2 !== "");
  for (const entry of entries ?? []) {
    if (entry.toLowerCase() === namespace + "/dup") {
      semconvStability = SemconvStability2.DUPLICATE;
      break;
    } else if (entry.toLowerCase() === namespace) {
      semconvStability = SemconvStability2.STABLE;
    }
  }
  return semconvStability;
}

// node_modules/.pnpm/@opentelemetry+core@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/environment.js
function getStringListFromEnv2(_2) {
  return void 0;
}

// node_modules/.pnpm/@opentelemetry+core@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/globalThis.js
var _globalThis5 = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};

// node_modules/.pnpm/@opentelemetry+core@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/platform/browser/performance.js
var otperformance2 = performance;

// node_modules/.pnpm/@opentelemetry+core@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/common/time.js
var NANOSECOND_DIGITS2 = 9;
var NANOSECOND_DIGITS_IN_MILLIS2 = 6;
var MILLISECONDS_TO_NANOSECONDS2 = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS2);
var SECOND_TO_NANOSECONDS2 = Math.pow(10, NANOSECOND_DIGITS2);
function millisToHrTime2(epochMillis) {
  const epochSeconds = epochMillis / 1e3;
  const seconds = Math.trunc(epochSeconds);
  const nanos = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS2);
  return [seconds, nanos];
}
function getTimeOrigin2() {
  let timeOrigin = otperformance2.timeOrigin;
  if (typeof timeOrigin !== "number") {
    const perf = otperformance2;
    timeOrigin = perf.timing && perf.timing.fetchStart;
  }
  return timeOrigin;
}
function hrTime2(performanceNow) {
  const timeOrigin = millisToHrTime2(getTimeOrigin2());
  const now = millisToHrTime2(typeof performanceNow === "number" ? performanceNow : otperformance2.now());
  return addHrTimes2(timeOrigin, now);
}
function timeInputToHrTime2(time) {
  if (isTimeInputHrTime2(time)) {
    return time;
  } else if (typeof time === "number") {
    if (time < getTimeOrigin2()) {
      return hrTime2(time);
    } else {
      return millisToHrTime2(time);
    }
  } else if (time instanceof Date) {
    return millisToHrTime2(time.getTime());
  } else {
    throw TypeError("Invalid input type");
  }
}
function hrTimeToNanoseconds2(time) {
  return time[0] * SECOND_TO_NANOSECONDS2 + time[1];
}
function isTimeInputHrTime2(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function addHrTimes2(time1, time2) {
  const out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS2) {
    out[1] -= SECOND_TO_NANOSECONDS2;
    out[0] += 1;
  }
  return out;
}

// node_modules/.pnpm/@opentelemetry+core@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/core/build/esm/utils/url.js
function urlMatches(url, urlToMatch) {
  if (typeof urlToMatch === "string") {
    return url === urlToMatch;
  } else {
    return !!url.match(urlToMatch);
  }
}
function isUrlIgnored(url, ignoredUrls) {
  if (!ignoredUrls) {
    return false;
  }
  for (const ignoreUrl of ignoredUrls) {
    if (urlMatches(url, ignoreUrl)) {
      return true;
    }
  }
  return false;
}

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/enums/PerformanceTimingNames.js
var PerformanceTimingNames2;
(function(PerformanceTimingNames3) {
  PerformanceTimingNames3["CONNECT_END"] = "connectEnd";
  PerformanceTimingNames3["CONNECT_START"] = "connectStart";
  PerformanceTimingNames3["DECODED_BODY_SIZE"] = "decodedBodySize";
  PerformanceTimingNames3["DOM_COMPLETE"] = "domComplete";
  PerformanceTimingNames3["DOM_CONTENT_LOADED_EVENT_END"] = "domContentLoadedEventEnd";
  PerformanceTimingNames3["DOM_CONTENT_LOADED_EVENT_START"] = "domContentLoadedEventStart";
  PerformanceTimingNames3["DOM_INTERACTIVE"] = "domInteractive";
  PerformanceTimingNames3["DOMAIN_LOOKUP_END"] = "domainLookupEnd";
  PerformanceTimingNames3["DOMAIN_LOOKUP_START"] = "domainLookupStart";
  PerformanceTimingNames3["ENCODED_BODY_SIZE"] = "encodedBodySize";
  PerformanceTimingNames3["FETCH_START"] = "fetchStart";
  PerformanceTimingNames3["LOAD_EVENT_END"] = "loadEventEnd";
  PerformanceTimingNames3["LOAD_EVENT_START"] = "loadEventStart";
  PerformanceTimingNames3["NAVIGATION_START"] = "navigationStart";
  PerformanceTimingNames3["REDIRECT_END"] = "redirectEnd";
  PerformanceTimingNames3["REDIRECT_START"] = "redirectStart";
  PerformanceTimingNames3["REQUEST_START"] = "requestStart";
  PerformanceTimingNames3["RESPONSE_END"] = "responseEnd";
  PerformanceTimingNames3["RESPONSE_START"] = "responseStart";
  PerformanceTimingNames3["SECURE_CONNECTION_START"] = "secureConnectionStart";
  PerformanceTimingNames3["START_TIME"] = "startTime";
  PerformanceTimingNames3["UNLOAD_EVENT_END"] = "unloadEventEnd";
  PerformanceTimingNames3["UNLOAD_EVENT_START"] = "unloadEventStart";
})(PerformanceTimingNames2 || (PerformanceTimingNames2 = {}));

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/semconv.js
var ATTR_HTTP_RESPONSE_CONTENT_LENGTH2 = "http.response_content_length";
var ATTR_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED2 = "http.response_content_length_uncompressed";

// node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.1.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-trace-web/build/esm/utils.js
var urlNormalizingAnchor;
function getUrlNormalizingAnchor() {
  if (!urlNormalizingAnchor) {
    urlNormalizingAnchor = document.createElement("a");
  }
  return urlNormalizingAnchor;
}
function hasKey2(obj, key) {
  return key in obj;
}
function addSpanNetworkEvent2(span, performanceName, entries, ignoreZeros = true) {
  if (hasKey2(entries, performanceName) && typeof entries[performanceName] === "number" && !(ignoreZeros && entries[performanceName] === 0)) {
    return span.addEvent(performanceName, entries[performanceName]);
  }
  return void 0;
}
function addSpanNetworkEvents2(span, resource, ignoreNetworkEvents = false, ignoreZeros, skipOldSemconvContentLengthAttrs) {
  if (ignoreZeros === void 0) {
    ignoreZeros = resource[PerformanceTimingNames2.START_TIME] !== 0;
  }
  if (!ignoreNetworkEvents) {
    addSpanNetworkEvent2(span, PerformanceTimingNames2.FETCH_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.DOMAIN_LOOKUP_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.DOMAIN_LOOKUP_END, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.CONNECT_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.SECURE_CONNECTION_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.CONNECT_END, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.REQUEST_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.RESPONSE_START, resource, ignoreZeros);
    addSpanNetworkEvent2(span, PerformanceTimingNames2.RESPONSE_END, resource, ignoreZeros);
  }
  if (!skipOldSemconvContentLengthAttrs) {
    const encodedLength = resource[PerformanceTimingNames2.ENCODED_BODY_SIZE];
    if (encodedLength !== void 0) {
      span.setAttribute(ATTR_HTTP_RESPONSE_CONTENT_LENGTH2, encodedLength);
    }
    const decodedLength = resource[PerformanceTimingNames2.DECODED_BODY_SIZE];
    if (decodedLength !== void 0 && encodedLength !== decodedLength) {
      span.setAttribute(ATTR_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED2, decodedLength);
    }
  }
}
function sortResources2(filteredResources) {
  return filteredResources.slice().sort((a2, b2) => {
    const valueA = a2[PerformanceTimingNames2.FETCH_START];
    const valueB = b2[PerformanceTimingNames2.FETCH_START];
    if (valueA > valueB) {
      return 1;
    } else if (valueA < valueB) {
      return -1;
    }
    return 0;
  });
}
function getOrigin() {
  return typeof location !== "undefined" ? location.origin : void 0;
}
function getResource2(spanUrl, startTimeHR, endTimeHR, resources, ignoredResources = /* @__PURE__ */ new WeakSet(), initiatorType) {
  const parsedSpanUrl = parseUrl2(spanUrl);
  spanUrl = parsedSpanUrl.toString();
  const filteredResources = filterResourcesForSpan(spanUrl, startTimeHR, endTimeHR, resources, ignoredResources, initiatorType);
  if (filteredResources.length === 0) {
    return {
      mainRequest: void 0
    };
  }
  if (filteredResources.length === 1) {
    return {
      mainRequest: filteredResources[0]
    };
  }
  const sorted = sortResources2(filteredResources);
  if (parsedSpanUrl.origin !== getOrigin() && sorted.length > 1) {
    let corsPreFlightRequest = sorted[0];
    let mainRequest = findMainRequest(sorted, corsPreFlightRequest[PerformanceTimingNames2.RESPONSE_END], endTimeHR);
    const responseEnd = corsPreFlightRequest[PerformanceTimingNames2.RESPONSE_END];
    const fetchStart = mainRequest[PerformanceTimingNames2.FETCH_START];
    if (fetchStart < responseEnd) {
      mainRequest = corsPreFlightRequest;
      corsPreFlightRequest = void 0;
    }
    return {
      corsPreFlightRequest,
      mainRequest
    };
  } else {
    return {
      mainRequest: filteredResources[0]
    };
  }
}
function findMainRequest(resources, corsPreFlightRequestEndTime, spanEndTimeHR) {
  const spanEndTime = hrTimeToNanoseconds2(spanEndTimeHR);
  const minTime = hrTimeToNanoseconds2(timeInputToHrTime2(corsPreFlightRequestEndTime));
  let mainRequest = resources[1];
  let bestGap;
  const length = resources.length;
  for (let i2 = 1; i2 < length; i2++) {
    const resource = resources[i2];
    const resourceStartTime = hrTimeToNanoseconds2(timeInputToHrTime2(resource[PerformanceTimingNames2.FETCH_START]));
    const resourceEndTime = hrTimeToNanoseconds2(timeInputToHrTime2(resource[PerformanceTimingNames2.RESPONSE_END]));
    const currentGap = spanEndTime - resourceEndTime;
    if (resourceStartTime >= minTime && (!bestGap || currentGap < bestGap)) {
      bestGap = currentGap;
      mainRequest = resource;
    }
  }
  return mainRequest;
}
function filterResourcesForSpan(spanUrl, startTimeHR, endTimeHR, resources, ignoredResources, initiatorType) {
  const startTime = hrTimeToNanoseconds2(startTimeHR);
  const endTime = hrTimeToNanoseconds2(endTimeHR);
  let filteredResources = resources.filter((resource) => {
    const resourceStartTime = hrTimeToNanoseconds2(timeInputToHrTime2(resource[PerformanceTimingNames2.FETCH_START]));
    const resourceEndTime = hrTimeToNanoseconds2(timeInputToHrTime2(resource[PerformanceTimingNames2.RESPONSE_END]));
    return resource.initiatorType.toLowerCase() === (initiatorType || "xmlhttprequest") && resource.name === spanUrl && resourceStartTime >= startTime && resourceEndTime <= endTime;
  });
  if (filteredResources.length > 0) {
    filteredResources = filteredResources.filter((resource) => {
      return !ignoredResources.has(resource);
    });
  }
  return filteredResources;
}
function parseUrl2(url) {
  if (typeof URL === "function") {
    return new URL(url, typeof document !== "undefined" ? document.baseURI : typeof location !== "undefined" ? location.href : void 0);
  }
  const element = getUrlNormalizingAnchor();
  element.href = url;
  return element;
}
function shouldPropagateTraceHeaders2(spanUrl, propagateTraceHeaderCorsUrls) {
  let propagateTraceHeaderUrls = propagateTraceHeaderCorsUrls || [];
  if (typeof propagateTraceHeaderUrls === "string" || propagateTraceHeaderUrls instanceof RegExp) {
    propagateTraceHeaderUrls = [propagateTraceHeaderUrls];
  }
  const parsedSpanUrl = parseUrl2(spanUrl);
  if (parsedSpanUrl.origin === getOrigin()) {
    return true;
  } else {
    return propagateTraceHeaderUrls.some((propagateTraceHeaderUrl) => urlMatches(spanUrl, propagateTraceHeaderUrl));
  }
}

// node_modules/.pnpm/@opentelemetry+instrumentation-fetch@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-fetch/build/esm/enums/AttributeNames.js
var AttributeNames2;
(function(AttributeNames3) {
  AttributeNames3["COMPONENT"] = "component";
  AttributeNames3["HTTP_STATUS_TEXT"] = "http.status_text";
})(AttributeNames2 || (AttributeNames2 = {}));

// node_modules/.pnpm/@opentelemetry+instrumentation-fetch@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-fetch/build/esm/semconv.js
var ATTR_HTTP_HOST = "http.host";
var ATTR_HTTP_METHOD = "http.method";
var ATTR_HTTP_REQUEST_BODY_SIZE = "http.request.body.size";
var ATTR_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = "http.request_content_length_uncompressed";
var ATTR_HTTP_SCHEME = "http.scheme";
var ATTR_HTTP_STATUS_CODE = "http.status_code";
var ATTR_HTTP_URL2 = "http.url";
var ATTR_HTTP_USER_AGENT2 = "http.user_agent";

// node_modules/.pnpm/@opentelemetry+instrumentation-fetch@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-fetch/build/esm/utils.js
var DIAG_LOGGER = diag2.createComponentLogger({
  namespace: "@opentelemetry/opentelemetry-instrumentation-fetch/utils"
});
function getFetchBodyLength(...args) {
  if (args[0] instanceof URL || typeof args[0] === "string") {
    const requestInit = args[1];
    if (!requestInit?.body) {
      return Promise.resolve();
    }
    if (requestInit.body instanceof ReadableStream) {
      const { body, length } = _getBodyNonDestructively(requestInit.body);
      requestInit.body = body;
      return length;
    } else {
      return Promise.resolve(getXHRBodyLength(requestInit.body));
    }
  } else {
    const info = args[0];
    if (!info?.body) {
      return Promise.resolve();
    }
    return info.clone().text().then((t3) => getByteLength(t3));
  }
}
function _getBodyNonDestructively(body) {
  if (!body.pipeThrough) {
    DIAG_LOGGER.warn("Platform has ReadableStream but not pipeThrough!");
    return {
      body,
      length: Promise.resolve(void 0)
    };
  }
  let length = 0;
  let resolveLength;
  const lengthPromise = new Promise((resolve) => {
    resolveLength = resolve;
  });
  const transform = new TransformStream({
    start() {
    },
    async transform(chunk, controller) {
      const bytearray = await chunk;
      length += bytearray.byteLength;
      controller.enqueue(chunk);
    },
    flush() {
      resolveLength(length);
    }
  });
  return {
    body: body.pipeThrough(transform),
    length: lengthPromise
  };
}
function isDocument(value) {
  return typeof Document !== "undefined" && value instanceof Document;
}
function getXHRBodyLength(body) {
  if (isDocument(body)) {
    return new XMLSerializer().serializeToString(document).length;
  }
  if (typeof body === "string") {
    return getByteLength(body);
  }
  if (body instanceof Blob) {
    return body.size;
  }
  if (body instanceof FormData) {
    return getFormDataSize(body);
  }
  if (body instanceof URLSearchParams) {
    return getByteLength(body.toString());
  }
  if (body.byteLength !== void 0) {
    return body.byteLength;
  }
  DIAG_LOGGER.warn("unknown body type");
  return void 0;
}
var TEXT_ENCODER = new TextEncoder();
function getByteLength(s2) {
  return TEXT_ENCODER.encode(s2).byteLength;
}
function getFormDataSize(formData) {
  let size = 0;
  for (const [key, value] of formData.entries()) {
    size += key.length;
    if (value instanceof Blob) {
      size += value.size;
    } else {
      size += value.length;
    }
  }
  return size;
}
function normalizeHttpRequestMethod(method) {
  const knownMethods2 = getKnownMethods();
  const methUpper = method.toUpperCase();
  if (methUpper in knownMethods2) {
    return methUpper;
  } else {
    return "_OTHER";
  }
}
var DEFAULT_KNOWN_METHODS = {
  CONNECT: true,
  DELETE: true,
  GET: true,
  HEAD: true,
  OPTIONS: true,
  PATCH: true,
  POST: true,
  PUT: true,
  TRACE: true
};
var knownMethods;
function getKnownMethods() {
  if (knownMethods === void 0) {
    const cfgMethods = getStringListFromEnv2("OTEL_INSTRUMENTATION_HTTP_KNOWN_METHODS");
    if (cfgMethods && cfgMethods.length > 0) {
      knownMethods = {};
      cfgMethods.forEach((m2) => {
        knownMethods[m2] = true;
      });
    } else {
      knownMethods = DEFAULT_KNOWN_METHODS;
    }
  }
  return knownMethods;
}
var HTTP_PORT_FROM_PROTOCOL = {
  "https:": "443",
  "http:": "80"
};
function serverPortFromUrl(url) {
  const serverPort = Number(url.port || HTTP_PORT_FROM_PROTOCOL[url.protocol]);
  if (serverPort && !isNaN(serverPort)) {
    return serverPort;
  } else {
    return void 0;
  }
}

// node_modules/.pnpm/@opentelemetry+instrumentation-fetch@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-fetch/build/esm/version.js
var VERSION5 = "0.205.0";

// node_modules/.pnpm/@opentelemetry+instrumentation-fetch@0.205.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation-fetch/build/esm/fetch.js
var OBSERVER_WAIT_TIME_MS = 300;
var isNode = typeof process === "object" && process.release?.name === "node";
var FetchInstrumentation = class extends InstrumentationBase2 {
  component = "fetch";
  version = VERSION5;
  moduleName = this.component;
  _usedResources = /* @__PURE__ */ new WeakSet();
  _tasksCount = 0;
  _semconvStability;
  constructor(config = {}) {
    super("@opentelemetry/instrumentation-fetch", VERSION5, config);
    this._semconvStability = semconvStabilityFromStr2("http", config?.semconvStabilityOptIn);
  }
  init() {
  }
  /**
   * Add cors pre flight child span
   * @param span
   * @param corsPreFlightRequest
   */
  _addChildSpan(span, corsPreFlightRequest) {
    const childSpan = this.tracer.startSpan("CORS Preflight", {
      startTime: corsPreFlightRequest[PerformanceTimingNames2.FETCH_START]
    }, trace.setSpan(context.active(), span));
    const skipOldSemconvContentLengthAttrs = !(this._semconvStability & SemconvStability2.OLD);
    addSpanNetworkEvents2(childSpan, corsPreFlightRequest, this.getConfig().ignoreNetworkEvents, void 0, skipOldSemconvContentLengthAttrs);
    childSpan.end(corsPreFlightRequest[PerformanceTimingNames2.RESPONSE_END]);
  }
  /**
   * Adds more attributes to span just before ending it
   * @param span
   * @param response
   */
  _addFinalSpanAttributes(span, response) {
    const parsedUrl = parseUrl2(response.url);
    if (this._semconvStability & SemconvStability2.OLD) {
      span.setAttribute(ATTR_HTTP_STATUS_CODE, response.status);
      if (response.statusText != null) {
        span.setAttribute(AttributeNames2.HTTP_STATUS_TEXT, response.statusText);
      }
      span.setAttribute(ATTR_HTTP_HOST, parsedUrl.host);
      span.setAttribute(ATTR_HTTP_SCHEME, parsedUrl.protocol.replace(":", ""));
      if (typeof navigator !== "undefined") {
        span.setAttribute(ATTR_HTTP_USER_AGENT2, navigator.userAgent);
      }
    }
    if (this._semconvStability & SemconvStability2.STABLE) {
      span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, response.status);
      span.setAttribute(ATTR_SERVER_ADDRESS, parsedUrl.hostname);
      const serverPort = serverPortFromUrl(parsedUrl);
      if (serverPort) {
        span.setAttribute(ATTR_SERVER_PORT, serverPort);
      }
    }
  }
  /**
   * Add headers
   * @param options
   * @param spanUrl
   */
  _addHeaders(options, spanUrl) {
    if (!shouldPropagateTraceHeaders2(spanUrl, this.getConfig().propagateTraceHeaderCorsUrls)) {
      const headers = {};
      propagation.inject(context.active(), headers);
      if (Object.keys(headers).length > 0) {
        this._diag.debug("headers inject skipped due to CORS policy");
      }
      return;
    }
    if (options instanceof Request) {
      propagation.inject(context.active(), options.headers, {
        set: (h2, k2, v2) => h2.set(k2, typeof v2 === "string" ? v2 : String(v2))
      });
    } else if (options.headers instanceof Headers) {
      propagation.inject(context.active(), options.headers, {
        set: (h2, k2, v2) => h2.set(k2, typeof v2 === "string" ? v2 : String(v2))
      });
    } else if (options.headers instanceof Map) {
      propagation.inject(context.active(), options.headers, {
        set: (h2, k2, v2) => h2.set(k2, typeof v2 === "string" ? v2 : String(v2))
      });
    } else {
      const headers = {};
      propagation.inject(context.active(), headers);
      options.headers = Object.assign({}, headers, options.headers || {});
    }
  }
  /**
   * Clears the resource timings and all resources assigned with spans
   *     when {@link FetchPluginConfig.clearTimingResources} is
   *     set to true (default false)
   * @private
   */
  _clearResources() {
    if (this._tasksCount === 0 && this.getConfig().clearTimingResources) {
      performance.clearResourceTimings();
      this._usedResources = /* @__PURE__ */ new WeakSet();
    }
  }
  /**
   * Creates a new span
   * @param url
   * @param options
   */
  _createSpan(url, options = {}) {
    if (isUrlIgnored(url, this.getConfig().ignoreUrls)) {
      this._diag.debug("ignoring span as url matches ignored url");
      return;
    }
    let name = "";
    const attributes = {};
    if (this._semconvStability & SemconvStability2.OLD) {
      const method = (options.method || "GET").toUpperCase();
      name = `HTTP ${method}`;
      attributes[AttributeNames2.COMPONENT] = this.moduleName;
      attributes[ATTR_HTTP_METHOD] = method;
      attributes[ATTR_HTTP_URL2] = url;
    }
    if (this._semconvStability & SemconvStability2.STABLE) {
      const origMethod = options.method;
      const normMethod = normalizeHttpRequestMethod(options.method || "GET");
      if (!name) {
        name = normMethod;
      }
      attributes[ATTR_HTTP_REQUEST_METHOD] = normMethod;
      if (normMethod !== origMethod) {
        attributes[ATTR_HTTP_REQUEST_METHOD_ORIGINAL] = origMethod;
      }
      attributes[ATTR_URL_FULL] = url;
    }
    return this.tracer.startSpan(name, {
      kind: SpanKind.CLIENT,
      attributes
    });
  }
  /**
   * Finds appropriate resource and add network events to the span
   * @param span
   * @param resourcesObserver
   * @param endTime
   */
  _findResourceAndAddNetworkEvents(span, resourcesObserver, endTime) {
    let resources = resourcesObserver.entries;
    if (!resources.length) {
      if (!performance.getEntriesByType) {
        return;
      }
      resources = performance.getEntriesByType("resource");
    }
    const resource = getResource2(resourcesObserver.spanUrl, resourcesObserver.startTime, endTime, resources, this._usedResources, "fetch");
    if (resource.mainRequest) {
      const mainRequest = resource.mainRequest;
      this._markResourceAsUsed(mainRequest);
      const corsPreFlightRequest = resource.corsPreFlightRequest;
      if (corsPreFlightRequest) {
        this._addChildSpan(span, corsPreFlightRequest);
        this._markResourceAsUsed(corsPreFlightRequest);
      }
      const skipOldSemconvContentLengthAttrs = !(this._semconvStability & SemconvStability2.OLD);
      addSpanNetworkEvents2(span, mainRequest, this.getConfig().ignoreNetworkEvents, void 0, skipOldSemconvContentLengthAttrs);
    }
  }
  /**
   * Marks certain [resource]{@link PerformanceResourceTiming} when information
   * from this is used to add events to span.
   * This is done to avoid reusing the same resource again for next span
   * @param resource
   */
  _markResourceAsUsed(resource) {
    this._usedResources.add(resource);
  }
  /**
   * Finish span, add attributes, network events etc.
   * @param span
   * @param spanData
   * @param response
   */
  _endSpan(span, spanData, response) {
    const endTime = millisToHrTime2(Date.now());
    const performanceEndTime = hrTime2();
    this._addFinalSpanAttributes(span, response);
    if (this._semconvStability & SemconvStability2.STABLE) {
      if (response.status >= 400) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.setAttribute(ATTR_ERROR_TYPE, String(response.status));
      }
    }
    setTimeout(() => {
      spanData.observer?.disconnect();
      this._findResourceAndAddNetworkEvents(span, spanData, performanceEndTime);
      this._tasksCount--;
      this._clearResources();
      span.end(endTime);
    }, OBSERVER_WAIT_TIME_MS);
  }
  /**
   * Patches the constructor of fetch
   */
  _patchConstructor() {
    return (original) => {
      const plugin = this;
      return function patchConstructor(...args) {
        const self2 = this;
        const url = parseUrl2(args[0] instanceof Request ? args[0].url : String(args[0])).href;
        const options = args[0] instanceof Request ? args[0] : args[1] || {};
        const createdSpan = plugin._createSpan(url, options);
        if (!createdSpan) {
          return original.apply(this, args);
        }
        const spanData = plugin._prepareSpanData(url);
        if (plugin.getConfig().measureRequestSize) {
          getFetchBodyLength(...args).then((bodyLength) => {
            if (!bodyLength)
              return;
            if (plugin._semconvStability & SemconvStability2.OLD) {
              createdSpan.setAttribute(ATTR_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED, bodyLength);
            }
            if (plugin._semconvStability & SemconvStability2.STABLE) {
              createdSpan.setAttribute(ATTR_HTTP_REQUEST_BODY_SIZE, bodyLength);
            }
          }).catch((error) => {
            plugin._diag.warn("getFetchBodyLength", error);
          });
        }
        function endSpanOnError(span, error) {
          plugin._applyAttributesAfterFetch(span, options, error);
          plugin._endSpan(span, spanData, {
            status: error.status || 0,
            statusText: error.message,
            url
          });
        }
        function endSpanOnSuccess(span, response) {
          plugin._applyAttributesAfterFetch(span, options, response);
          if (response.status >= 200 && response.status < 400) {
            plugin._endSpan(span, spanData, response);
          } else {
            plugin._endSpan(span, spanData, {
              status: response.status,
              statusText: response.statusText,
              url
            });
          }
        }
        function onSuccess(span, resolve, response) {
          try {
            const resClone = response.clone();
            const body = resClone.body;
            if (body) {
              const reader = body.getReader();
              const read = () => {
                reader.read().then(({ done }) => {
                  if (done) {
                    endSpanOnSuccess(span, response);
                  } else {
                    read();
                  }
                }, (error) => {
                  endSpanOnError(span, error);
                });
              };
              read();
            } else {
              endSpanOnSuccess(span, response);
            }
          } finally {
            resolve(response);
          }
        }
        function onError(span, reject, error) {
          try {
            endSpanOnError(span, error);
          } finally {
            reject(error);
          }
        }
        return new Promise((resolve, reject) => {
          return context.with(trace.setSpan(context.active(), createdSpan), () => {
            plugin._addHeaders(options, url);
            plugin._callRequestHook(createdSpan, options);
            plugin._tasksCount++;
            return original.apply(self2, options instanceof Request ? [options] : [url, options]).then(onSuccess.bind(self2, createdSpan, resolve), onError.bind(self2, createdSpan, reject));
          });
        });
      };
    };
  }
  _applyAttributesAfterFetch(span, request, result) {
    const applyCustomAttributesOnSpan = this.getConfig().applyCustomAttributesOnSpan;
    if (applyCustomAttributesOnSpan) {
      safeExecuteInTheMiddle2(() => applyCustomAttributesOnSpan(span, request, result), (error) => {
        if (!error) {
          return;
        }
        this._diag.error("applyCustomAttributesOnSpan", error);
      }, true);
    }
  }
  _callRequestHook(span, request) {
    const requestHook = this.getConfig().requestHook;
    if (requestHook) {
      safeExecuteInTheMiddle2(() => requestHook(span, request), (error) => {
        if (!error) {
          return;
        }
        this._diag.error("requestHook", error);
      }, true);
    }
  }
  /**
   * Prepares a span data - needed later for matching appropriate network
   *     resources
   * @param spanUrl
   */
  _prepareSpanData(spanUrl) {
    const startTime = hrTime2();
    const entries = [];
    if (typeof PerformanceObserver !== "function") {
      return { entries, startTime, spanUrl };
    }
    const observer = new PerformanceObserver((list) => {
      const perfObsEntries = list.getEntries();
      perfObsEntries.forEach((entry) => {
        if (entry.initiatorType === "fetch" && entry.name === spanUrl) {
          entries.push(entry);
        }
      });
    });
    observer.observe({
      entryTypes: ["resource"]
    });
    return { entries, observer, startTime, spanUrl };
  }
  /**
   * implements enable function
   */
  enable() {
    if (isNode) {
      this._diag.warn("this instrumentation is intended for web usage only, it does not instrument Node.js's fetch()");
      return;
    }
    if (isWrapped2(fetch)) {
      this._unwrap(_globalThis5, "fetch");
      this._diag.debug("removing previous patch for constructor");
    }
    this._wrap(_globalThis5, "fetch", this._patchConstructor());
  }
  /**
   * implements unpatch function
   */
  disable() {
    if (isNode) {
      return;
    }
    this._unwrap(_globalThis5, "fetch");
    this._usedResources = /* @__PURE__ */ new WeakSet();
  }
};

// node_modules/.pnpm/web-vitals@5.1.0/node_modules/web-vitals/dist/web-vitals.js
var e = -1;
var t = (t3) => {
  addEventListener("pageshow", ((n2) => {
    n2.persisted && (e = n2.timeStamp, t3(n2));
  }), true);
};
var n = (e2, t3, n2, i2) => {
  let s2, o2;
  return (r2) => {
    t3.value >= 0 && (r2 || i2) && (o2 = t3.value - (s2 ?? 0), (o2 || void 0 === s2) && (s2 = t3.value, t3.delta = o2, t3.rating = ((e3, t4) => e3 > t4[1] ? "poor" : e3 > t4[0] ? "needs-improvement" : "good")(t3.value, n2), e2(t3)));
  };
};
var i = (e2) => {
  requestAnimationFrame((() => requestAnimationFrame((() => e2()))));
};
var s = () => {
  const e2 = performance.getEntriesByType("navigation")[0];
  if (e2 && e2.responseStart > 0 && e2.responseStart < performance.now()) return e2;
};
var o = () => {
  const e2 = s();
  return e2?.activationStart ?? 0;
};
var r = (t3, n2 = -1) => {
  const i2 = s();
  let r2 = "navigate";
  e >= 0 ? r2 = "back-forward-cache" : i2 && (document.prerendering || o() > 0 ? r2 = "prerender" : document.wasDiscarded ? r2 = "restore" : i2.type && (r2 = i2.type.replace(/_/g, "-")));
  return { name: t3, value: n2, rating: "good", delta: 0, entries: [], id: `v5-${Date.now()}-${Math.floor(8999999999999 * Math.random()) + 1e12}`, navigationType: r2 };
};
var c = /* @__PURE__ */ new WeakMap();
function a(e2, t3) {
  return c.get(e2) || c.set(e2, new t3()), c.get(e2);
}
var d = class {
  t;
  i = 0;
  o = [];
  h(e2) {
    if (e2.hadRecentInput) return;
    const t3 = this.o[0], n2 = this.o.at(-1);
    this.i && t3 && n2 && e2.startTime - n2.startTime < 1e3 && e2.startTime - t3.startTime < 5e3 ? (this.i += e2.value, this.o.push(e2)) : (this.i = e2.value, this.o = [e2]), this.t?.(e2);
  }
};
var h = (e2, t3, n2 = {}) => {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e2)) {
      const i2 = new PerformanceObserver(((e3) => {
        Promise.resolve().then((() => {
          t3(e3.getEntries());
        }));
      }));
      return i2.observe({ type: e2, buffered: true, ...n2 }), i2;
    }
  } catch {
  }
};
var f = (e2) => {
  let t3 = false;
  return () => {
    t3 || (e2(), t3 = true);
  };
};
var u = -1;
var l = /* @__PURE__ */ new Set();
var m = () => "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
var p = (e2) => {
  if ("hidden" === document.visibilityState) {
    if ("visibilitychange" === e2.type) for (const e3 of l) e3();
    isFinite(u) || (u = "visibilitychange" === e2.type ? e2.timeStamp : 0, removeEventListener("prerenderingchange", p, true));
  }
};
var v = () => {
  if (u < 0) {
    const e2 = o(), n2 = document.prerendering ? void 0 : globalThis.performance.getEntriesByType("visibility-state").filter(((t3) => "hidden" === t3.name && t3.startTime > e2))[0]?.startTime;
    u = n2 ?? m(), addEventListener("visibilitychange", p, true), addEventListener("prerenderingchange", p, true), t((() => {
      setTimeout((() => {
        u = m();
      }));
    }));
  }
  return { get firstHiddenTime() {
    return u;
  }, onHidden(e2) {
    l.add(e2);
  } };
};
var g = (e2) => {
  document.prerendering ? addEventListener("prerenderingchange", (() => e2()), true) : e2();
};
var y = [1800, 3e3];
var E = (e2, s2 = {}) => {
  g((() => {
    const c2 = v();
    let a2, d2 = r("FCP");
    const f2 = h("paint", ((e3) => {
      for (const t3 of e3) "first-contentful-paint" === t3.name && (f2.disconnect(), t3.startTime < c2.firstHiddenTime && (d2.value = Math.max(t3.startTime - o(), 0), d2.entries.push(t3), a2(true)));
    }));
    f2 && (a2 = n(e2, d2, y, s2.reportAllChanges), t(((t3) => {
      d2 = r("FCP"), a2 = n(e2, d2, y, s2.reportAllChanges), i((() => {
        d2.value = performance.now() - t3.timeStamp, a2(true);
      }));
    })));
  }));
};
var b = [0.1, 0.25];
var L = (e2, s2 = {}) => {
  const o2 = v();
  E(f((() => {
    let c2, f2 = r("CLS", 0);
    const u2 = a(s2, d), l2 = (e3) => {
      for (const t3 of e3) u2.h(t3);
      u2.i > f2.value && (f2.value = u2.i, f2.entries = u2.o, c2());
    }, m2 = h("layout-shift", l2);
    m2 && (c2 = n(e2, f2, b, s2.reportAllChanges), o2.onHidden((() => {
      l2(m2.takeRecords()), c2(true);
    })), t((() => {
      u2.i = 0, f2 = r("CLS", 0), c2 = n(e2, f2, b, s2.reportAllChanges), i((() => c2()));
    })), setTimeout(c2));
  })));
};
var P = 0;
var T = 1 / 0;
var _ = 0;
var M = (e2) => {
  for (const t3 of e2) t3.interactionId && (T = Math.min(T, t3.interactionId), _ = Math.max(_, t3.interactionId), P = _ ? (_ - T) / 7 + 1 : 0);
};
var w;
var C = () => w ? P : performance.interactionCount ?? 0;
var I = () => {
  "interactionCount" in performance || w || (w = h("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
};
var F = 0;
var k = class {
  u = [];
  l = /* @__PURE__ */ new Map();
  m;
  p;
  v() {
    F = C(), this.u.length = 0, this.l.clear();
  }
  L() {
    const e2 = Math.min(this.u.length - 1, Math.floor((C() - F) / 50));
    return this.u[e2];
  }
  h(e2) {
    if (this.m?.(e2), !e2.interactionId && "first-input" !== e2.entryType) return;
    const t3 = this.u.at(-1);
    let n2 = this.l.get(e2.interactionId);
    if (n2 || this.u.length < 10 || e2.duration > t3.P) {
      if (n2 ? e2.duration > n2.P ? (n2.entries = [e2], n2.P = e2.duration) : e2.duration === n2.P && e2.startTime === n2.entries[0].startTime && n2.entries.push(e2) : (n2 = { id: e2.interactionId, entries: [e2], P: e2.duration }, this.l.set(n2.id, n2), this.u.push(n2)), this.u.sort(((e3, t4) => t4.P - e3.P)), this.u.length > 10) {
        const e3 = this.u.splice(10);
        for (const t4 of e3) this.l.delete(t4.id);
      }
      this.p?.(n2);
    }
  }
};
var A = (e2) => {
  const t3 = globalThis.requestIdleCallback || setTimeout;
  "hidden" === document.visibilityState ? e2() : (e2 = f(e2), addEventListener("visibilitychange", e2, { once: true, capture: true }), t3((() => {
    e2(), removeEventListener("visibilitychange", e2, { capture: true });
  })));
};
var B = [200, 500];
var S = (e2, i2 = {}) => {
  if (!globalThis.PerformanceEventTiming || !("interactionId" in PerformanceEventTiming.prototype)) return;
  const s2 = v();
  g((() => {
    I();
    let o2, c2 = r("INP");
    const d2 = a(i2, k), f2 = (e3) => {
      A((() => {
        for (const t4 of e3) d2.h(t4);
        const t3 = d2.L();
        t3 && t3.P !== c2.value && (c2.value = t3.P, c2.entries = t3.entries, o2());
      }));
    }, u2 = h("event", f2, { durationThreshold: i2.durationThreshold ?? 40 });
    o2 = n(e2, c2, B, i2.reportAllChanges), u2 && (u2.observe({ type: "first-input", buffered: true }), s2.onHidden((() => {
      f2(u2.takeRecords()), o2(true);
    })), t((() => {
      d2.v(), c2 = r("INP"), o2 = n(e2, c2, B, i2.reportAllChanges);
    })));
  }));
};
var N = class {
  m;
  h(e2) {
    this.m?.(e2);
  }
};
var q = [2500, 4e3];
var x = (e2, s2 = {}) => {
  g((() => {
    const c2 = v();
    let d2, u2 = r("LCP");
    const l2 = a(s2, N), m2 = (e3) => {
      s2.reportAllChanges || (e3 = e3.slice(-1));
      for (const t3 of e3) l2.h(t3), t3.startTime < c2.firstHiddenTime && (u2.value = Math.max(t3.startTime - o(), 0), u2.entries = [t3], d2());
    }, p2 = h("largest-contentful-paint", m2);
    if (p2) {
      d2 = n(e2, u2, q, s2.reportAllChanges);
      const o2 = f((() => {
        m2(p2.takeRecords()), p2.disconnect(), d2(true);
      })), c3 = (e3) => {
        e3.isTrusted && (A(o2), removeEventListener(e3.type, c3, { capture: true }));
      };
      for (const e3 of ["keydown", "click", "visibilitychange"]) addEventListener(e3, c3, { capture: true });
      t(((t3) => {
        u2 = r("LCP"), d2 = n(e2, u2, q, s2.reportAllChanges), i((() => {
          u2.value = performance.now() - t3.timeStamp, d2(true);
        }));
      }));
    }
  }));
};
var H = [800, 1800];
var O = (e2) => {
  document.prerendering ? g((() => O(e2))) : "complete" !== document.readyState ? addEventListener("load", (() => O(e2)), true) : setTimeout(e2);
};
var $ = (e2, i2 = {}) => {
  let c2 = r("TTFB"), a2 = n(e2, c2, H, i2.reportAllChanges);
  O((() => {
    const d2 = s();
    d2 && (c2.value = Math.max(d2.responseStart - o(), 0), c2.entries = [d2], a2(true), t((() => {
      c2 = r("TTFB", 0), a2 = n(e2, c2, H, i2.reportAllChanges), a2(true);
    })));
  }));
};

// packages/telemetry/src/browser.js
function createBrowserTelemetry(options = {}) {
  const provider = new WebTracerProvider();
  const zoneIsAvailable = typeof globalThis !== "undefined" && typeof globalThis.Zone !== "undefined";
  provider.register(zoneIsAvailable ? {
    contextManager: new ZoneContextManager()
  } : void 0);
  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/
      })
    ]
  });
  const tracer = trace.getTracer(options.serviceName ?? "faith-web-ui");
  return {
    tracer,
    trackVitals(report) {
      const sender = (metric) => {
        report(createVitalPayload(metric));
      };
      L(sender);
      E(sender);
      S(sender);
      x(sender);
      $(sender);
    },
    withSpan(name, fn) {
      const span = tracer.startSpan(name);
      return context.with(trace.setSpan(context.active(), span), async () => {
        try {
          return await fn(span);
        } finally {
          span.end();
        }
      });
    }
  };
}
function createVitalPayload(metric) {
  return {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType
  };
}

// apps/web/src/app.js
var sessionStorageKey = "faith_session";
var accessMatrix = {
  platform_admin: ["dashboard", "reporting"],
  practice_owner: ["dashboard", "clients", "scheduling", "clinical", "documents", "billing", "portal", "reporting", "faith"],
  practice_admin: ["dashboard", "clients", "scheduling", "clinical", "documents", "billing", "portal", "reporting", "faith"],
  counselor: ["dashboard", "clients", "scheduling", "clinical", "documents", "portal", "reporting", "faith"],
  intern: ["dashboard", "clients", "scheduling", "clinical"],
  scheduler_biller: ["dashboard", "clients", "scheduling", "billing", "reporting"],
  client: ["dashboard", "portal"]
};
var tabAccessMatrix = {
  platform_admin: ["reporting", "language"],
  practice_owner: ["practice", "locations", "staff", "lifecycle", "chart", "documentsStudio", "clients", "appointments", "billing", "portal", "reporting", "faith", "language"],
  practice_admin: ["practice", "locations", "staff", "lifecycle", "chart", "documentsStudio", "clients", "appointments", "billing", "portal", "reporting", "faith", "language"],
  counselor: ["lifecycle", "chart", "documentsStudio", "clients", "appointments", "portal", "reporting", "faith"],
  intern: ["lifecycle", "chart", "clients", "appointments"],
  scheduler_biller: ["clients", "appointments", "billing", "portal", "reporting"],
  client: ["portal"]
};
var navToTabMap = {
  clients: "clients",
  scheduling: "appointments",
  clinical: "chart",
  documents: "documentsStudio",
  billing: "billing",
  portal: "portal",
  reporting: "reporting",
  faith: "faith"
};
var tabToNavMap = {
  practice: "dashboard",
  locations: "dashboard",
  staff: "dashboard",
  lifecycle: "clients",
  chart: "clinical",
  documentsStudio: "documents",
  clients: "clients",
  appointments: "scheduling",
  billing: "billing",
  portal: "portal",
  reporting: "reporting",
  faith: "faith",
  language: "reporting"
};
var state = {
  locale: defaultLocale,
  messages: buildLocaleCatalog(),
  locales: [],
  translationCatalog: null,
  translationDraft: {},
  clients: [],
  appointments: [],
  appointmentTypes: [],
  practices: [],
  locations: [],
  staff: [],
  staffAvailability: [],
  clientLifecycle: {},
  clientConsents: {},
  clientIntakePackets: {},
  clientTreatmentPlans: {},
  clientProgressNotes: {},
  documentTemplates: [],
  documentAssignments: [],
  inventoryDefinitions: [],
  inventoryAssignments: [],
  serviceCodes: [],
  feeSchedules: [],
  invoices: [],
  payments: [],
  superbills: [],
  claimPlaceholders: [],
  agingReport: null,
  portalAccount: null,
  portalForms: [],
  portalDocuments: [],
  portalBalances: null,
  portalResources: [],
  portalMessageThreads: [],
  portalAppointmentRequests: [],
  faithNoteTemplates: [],
  faithTreatmentGoals: [],
  faithConsentVariants: [],
  faithResources: [],
  faithInventories: [],
  faithReferralCoordinations: [],
  faithLanguagePreference: null,
  reportingOverview: null,
  platformOverview: null,
  operationsSummary: null,
  activeLifecycleClientId: "",
  activeChartClientId: "",
  activePortalClientId: "",
  activeFaithPracticeId: "",
  activeReportingTenantId: "",
  activeScheduleItems: [],
  activeRole: "",
  activeTab: "clients",
  telemetrySummary: null,
  translationSettings: {
    sourceLocale: "en",
    tone: "neutral",
    fallbackMode: "prefixed",
    useGlossary: true,
    glossary: {}
  }
};
var elements = {
  authGate: document.getElementById("authGate"),
  roleSelect: document.getElementById("roleSelect"),
  continueButton: document.getElementById("continueButton"),
  logoutButton: document.getElementById("logoutButton"),
  userBadge: document.getElementById("userBadge"),
  globalSearch: document.getElementById("globalSearch"),
  dataConnection: document.getElementById("dataConnection"),
  timelineList: document.getElementById("timelineList"),
  priorityList: document.getElementById("priorityList"),
  complianceList: document.getElementById("complianceList"),
  languageSelect: document.getElementById("languageSelect"),
  translationLocaleSelect: document.getElementById("translationLocaleSelect"),
  translationEditor: document.getElementById("translationEditor"),
  translationFilter: document.getElementById("translationFilter"),
  languageStatus: document.getElementById("languageStatus"),
  manageStatus: document.getElementById("manageStatus"),
  paletteInput: document.getElementById("paletteInput"),
  paletteList: document.getElementById("paletteList"),
  commandPalette: document.getElementById("commandPalette"),
  paletteBackdrop: document.getElementById("paletteBackdrop"),
  openPaletteButton: document.getElementById("openPaletteButton"),
  telemetryGrid: document.getElementById("telemetryGrid"),
  refreshTelemetryButton: document.getElementById("refreshTelemetryButton"),
  metricSessionsValue: document.getElementById("metricSessionsValue"),
  metricSessionsMeta: document.getElementById("metricSessionsMeta"),
  metricRolesValue: document.getElementById("metricRolesValue"),
  metricRolesMeta: document.getElementById("metricRolesMeta"),
  metricApptValue: document.getElementById("metricApptValue"),
  metricApptMeta: document.getElementById("metricApptMeta"),
  metricAuditValue: document.getElementById("metricAuditValue"),
  metricAuditMeta: document.getElementById("metricAuditMeta"),
  clientSelect: document.getElementById("clientSelect"),
  clientStatusSelect: document.getElementById("clientStatusSelect"),
  updateClientButton: document.getElementById("updateClientButton"),
  newClientFirstName: document.getElementById("newClientFirstName"),
  newClientLastName: document.getElementById("newClientLastName"),
  newClientFaithBackground: document.getElementById("newClientFaithBackground"),
  newClientStatusSelect: document.getElementById("newClientStatusSelect"),
  createClientButton: document.getElementById("createClientButton"),
  appointmentSelect: document.getElementById("appointmentSelect"),
  appointmentStatusSelect: document.getElementById("appointmentStatusSelect"),
  appointmentTypeSelect: document.getElementById("appointmentTypeSelect"),
  updateAppointmentButton: document.getElementById("updateAppointmentButton"),
  cancelAppointmentButton: document.getElementById("cancelAppointmentButton"),
  deleteAppointmentButton: document.getElementById("deleteAppointmentButton"),
  newAppointmentClientSelect: document.getElementById("newAppointmentClientSelect"),
  newAppointmentStart: document.getElementById("newAppointmentStart"),
  newAppointmentEnd: document.getElementById("newAppointmentEnd"),
  newAppointmentTypeSelect: document.getElementById("newAppointmentTypeSelect"),
  newAppointmentCounselor: document.getElementById("newAppointmentCounselor"),
  newAppointmentLocation: document.getElementById("newAppointmentLocation"),
  newAppointmentRemote: document.getElementById("newAppointmentRemote"),
  createAppointmentButton: document.getElementById("createAppointmentButton"),
  newAppointmentButton: document.getElementById("newAppointmentButton"),
  createPracticeButton: document.getElementById("createPracticeButton"),
  practiceSelect: document.getElementById("practiceSelect"),
  newPracticeName: document.getElementById("newPracticeName"),
  newPracticeType: document.getElementById("newPracticeType"),
  newPracticeTimezone: document.getElementById("newPracticeTimezone"),
  practiceName: document.getElementById("practiceName"),
  practiceFaithTradition: document.getElementById("practiceFaithTradition"),
  practiceContactEmail: document.getElementById("practiceContactEmail"),
  updatePracticeButton: document.getElementById("updatePracticeButton"),
  createLocationButton: document.getElementById("createLocationButton"),
  locationSelect: document.getElementById("locationSelect"),
  newLocationName: document.getElementById("newLocationName"),
  newLocationAddress: document.getElementById("newLocationAddress"),
  newLocationCapacity: document.getElementById("newLocationCapacity"),
  newLocationRemoteEnabled: document.getElementById("newLocationRemoteEnabled"),
  locationName: document.getElementById("locationName"),
  locationAddress: document.getElementById("locationAddress"),
  locationCapacity: document.getElementById("locationCapacity"),
  locationRemoteEnabled: document.getElementById("locationRemoteEnabled"),
  updateLocationButton: document.getElementById("updateLocationButton"),
  deleteLocationButton: document.getElementById("deleteLocationButton"),
  createStaffButton: document.getElementById("createStaffButton"),
  staffSelect: document.getElementById("staffSelect"),
  newStaffFirstName: document.getElementById("newStaffFirstName"),
  newStaffLastName: document.getElementById("newStaffLastName"),
  newStaffRole: document.getElementById("newStaffRole"),
  newStaffLicenseType: document.getElementById("newStaffLicenseType"),
  newStaffSupervisionStatus: document.getElementById("newStaffSupervisionStatus"),
  staffRole: document.getElementById("staffRole"),
  staffLicenseType: document.getElementById("staffLicenseType"),
  staffSupervisionStatus: document.getElementById("staffSupervisionStatus"),
  staffAvailabilityTemplate: document.getElementById("staffAvailabilityTemplate"),
  updateStaffButton: document.getElementById("updateStaffButton"),
  saveStaffAvailabilityButton: document.getElementById("saveStaffAvailabilityButton"),
  lifecycleClientSelect: document.getElementById("lifecycleClientSelect"),
  lifecycleCaseStatus: document.getElementById("lifecycleCaseStatus"),
  lifecycleReferralSource: document.getElementById("lifecycleReferralSource"),
  lifecycleEmergencyName: document.getElementById("lifecycleEmergencyName"),
  lifecycleEmergencyRelationship: document.getElementById("lifecycleEmergencyRelationship"),
  lifecycleEmergencyPhone: document.getElementById("lifecycleEmergencyPhone"),
  lifecycleEmergencyAuthorized: document.getElementById("lifecycleEmergencyAuthorized"),
  saveLifecycleButton: document.getElementById("saveLifecycleButton"),
  consentType: document.getElementById("consentType"),
  consentSignatureState: document.getElementById("consentSignatureState"),
  consentVersion: document.getElementById("consentVersion"),
  createConsentButton: document.getElementById("createConsentButton"),
  intakeStatus: document.getElementById("intakeStatus"),
  intakeAssignedForms: document.getElementById("intakeAssignedForms"),
  saveIntakePacketButton: document.getElementById("saveIntakePacketButton"),
  chartClientSelect: document.getElementById("chartClientSelect"),
  treatmentPlanStatus: document.getElementById("treatmentPlanStatus"),
  treatmentPlanGoals: document.getElementById("treatmentPlanGoals"),
  treatmentPlanInterventions: document.getElementById("treatmentPlanInterventions"),
  saveTreatmentPlanButton: document.getElementById("saveTreatmentPlanButton"),
  progressNoteType: document.getElementById("progressNoteType"),
  progressNoteSummary: document.getElementById("progressNoteSummary"),
  progressNoteLocked: document.getElementById("progressNoteLocked"),
  createProgressNoteButton: document.getElementById("createProgressNoteButton"),
  documentTemplateTitle: document.getElementById("documentTemplateTitle"),
  documentTemplateType: document.getElementById("documentTemplateType"),
  documentTemplateAudience: document.getElementById("documentTemplateAudience"),
  documentTemplateVersion: document.getElementById("documentTemplateVersion"),
  documentTemplateBlocks: document.getElementById("documentTemplateBlocks"),
  createDocumentTemplateButton: document.getElementById("createDocumentTemplateButton"),
  documentsClientSelect: document.getElementById("documentsClientSelect"),
  documentTemplateSelect: document.getElementById("documentTemplateSelect"),
  documentAssignmentStatus: document.getElementById("documentAssignmentStatus"),
  documentAssignmentRequiresSignature: document.getElementById("documentAssignmentRequiresSignature"),
  assignDocumentTemplateButton: document.getElementById("assignDocumentTemplateButton"),
  inventoryDefinitionName: document.getElementById("inventoryDefinitionName"),
  inventoryCategory: document.getElementById("inventoryCategory"),
  inventoryScoringMethod: document.getElementById("inventoryScoringMethod"),
  inventoryQuestionSchema: document.getElementById("inventoryQuestionSchema"),
  createInventoryDefinitionButton: document.getElementById("createInventoryDefinitionButton"),
  inventoryClientSelect: document.getElementById("inventoryClientSelect"),
  inventoryDefinitionSelect: document.getElementById("inventoryDefinitionSelect"),
  inventoryAssignmentStatus: document.getElementById("inventoryAssignmentStatus"),
  inventoryResponseEntries: document.getElementById("inventoryResponseEntries"),
  submitInventoryAssignmentButton: document.getElementById("submitInventoryAssignmentButton"),
  billingClientSelect: document.getElementById("billingClientSelect"),
  billingInvoiceServiceCodeSelect: document.getElementById("billingInvoiceServiceCodeSelect"),
  billingServiceCode: document.getElementById("billingServiceCode"),
  billingServiceName: document.getElementById("billingServiceName"),
  billingServiceCategory: document.getElementById("billingServiceCategory"),
  billingServiceDuration: document.getElementById("billingServiceDuration"),
  createServiceCodeButton: document.getElementById("createServiceCodeButton"),
  billingFeeScheduleName: document.getElementById("billingFeeScheduleName"),
  billingFeeScheduleCurrency: document.getElementById("billingFeeScheduleCurrency"),
  billingFeeScheduleLines: document.getElementById("billingFeeScheduleLines"),
  createFeeScheduleButton: document.getElementById("createFeeScheduleButton"),
  billingInvoiceUnitAmount: document.getElementById("billingInvoiceUnitAmount"),
  billingInvoiceDueAt: document.getElementById("billingInvoiceDueAt"),
  billingInvoicePayerName: document.getElementById("billingInvoicePayerName"),
  createInvoiceButton: document.getElementById("createInvoiceButton"),
  billingInvoiceSelect: document.getElementById("billingInvoiceSelect"),
  billingPaymentAmount: document.getElementById("billingPaymentAmount"),
  billingPaymentMethod: document.getElementById("billingPaymentMethod"),
  recordPaymentButton: document.getElementById("recordPaymentButton"),
  createSuperbillButton: document.getElementById("createSuperbillButton"),
  billingClaimStatus: document.getElementById("billingClaimStatus"),
  createClaimButton: document.getElementById("createClaimButton"),
  billingAgingAsOf: document.getElementById("billingAgingAsOf"),
  refreshAgingReportButton: document.getElementById("refreshAgingReportButton"),
  billingAgingSummary: document.getElementById("billingAgingSummary"),
  portalClientSelect: document.getElementById("portalClientSelect"),
  portalAccountStatus: document.getElementById("portalAccountStatus"),
  portalAccountEmail: document.getElementById("portalAccountEmail"),
  createPortalAccountButton: document.getElementById("createPortalAccountButton"),
  refreshPortalOverviewButton: document.getElementById("refreshPortalOverviewButton"),
  portalOverviewSummary: document.getElementById("portalOverviewSummary"),
  portalIntakeStatus: document.getElementById("portalIntakeStatus"),
  portalIntakeForms: document.getElementById("portalIntakeForms"),
  submitPortalIntakeButton: document.getElementById("submitPortalIntakeButton"),
  portalDocumentSelect: document.getElementById("portalDocumentSelect"),
  portalDocumentStatus: document.getElementById("portalDocumentStatus"),
  signPortalDocumentButton: document.getElementById("signPortalDocumentButton"),
  portalRequestStart: document.getElementById("portalRequestStart"),
  portalRequestEnd: document.getElementById("portalRequestEnd"),
  portalRequestMode: document.getElementById("portalRequestMode"),
  portalRequestNotes: document.getElementById("portalRequestNotes"),
  createPortalRequestButton: document.getElementById("createPortalRequestButton"),
  portalMessageThreadSelect: document.getElementById("portalMessageThreadSelect"),
  portalMessageSubject: document.getElementById("portalMessageSubject"),
  portalMessageBody: document.getElementById("portalMessageBody"),
  sendPortalMessageButton: document.getElementById("sendPortalMessageButton"),
  portalResourceTitle: document.getElementById("portalResourceTitle"),
  portalResourceType: document.getElementById("portalResourceType"),
  portalResourceContent: document.getElementById("portalResourceContent"),
  publishPortalResourceButton: document.getElementById("publishPortalResourceButton"),
  faithPracticeSelect: document.getElementById("faithPracticeSelect"),
  refreshFaithOverviewButton: document.getElementById("refreshFaithOverviewButton"),
  faithOverviewSummary: document.getElementById("faithOverviewSummary"),
  faithNoteTemplateName: document.getElementById("faithNoteTemplateName"),
  faithNoteFocusArea: document.getElementById("faithNoteFocusArea"),
  faithIntegrationLevel: document.getElementById("faithIntegrationLevel"),
  faithTemplateSections: document.getElementById("faithTemplateSections"),
  createFaithTemplateButton: document.getElementById("createFaithTemplateButton"),
  faithGoalTitle: document.getElementById("faithGoalTitle"),
  faithGoalScriptures: document.getElementById("faithGoalScriptures"),
  faithGoalMilestones: document.getElementById("faithGoalMilestones"),
  createFaithGoalButton: document.getElementById("createFaithGoalButton"),
  faithConsentTitle: document.getElementById("faithConsentTitle"),
  faithConsentAudience: document.getElementById("faithConsentAudience"),
  faithConsentBody: document.getElementById("faithConsentBody"),
  createFaithConsentVariantButton: document.getElementById("createFaithConsentVariantButton"),
  faithResourceTitle: document.getElementById("faithResourceTitle"),
  faithResourceType: document.getElementById("faithResourceType"),
  faithResourceScripture: document.getElementById("faithResourceScripture"),
  faithResourceContent: document.getElementById("faithResourceContent"),
  createFaithResourceButton: document.getElementById("createFaithResourceButton"),
  faithInventoryName: document.getElementById("faithInventoryName"),
  faithInventoryCadence: document.getElementById("faithInventoryCadence"),
  faithInventoryPrompts: document.getElementById("faithInventoryPrompts"),
  createFaithInventoryButton: document.getElementById("createFaithInventoryButton"),
  faithCoordinationClientSelect: document.getElementById("faithCoordinationClientSelect"),
  faithCoordinationChurch: document.getElementById("faithCoordinationChurch"),
  faithCoordinationStatus: document.getElementById("faithCoordinationStatus"),
  faithCoordinationContactName: document.getElementById("faithCoordinationContactName"),
  faithCoordinationContactMethod: document.getElementById("faithCoordinationContactMethod"),
  faithCoordinationConsent: document.getElementById("faithCoordinationConsent"),
  faithCoordinationNotes: document.getElementById("faithCoordinationNotes"),
  createFaithCoordinationButton: document.getElementById("createFaithCoordinationButton"),
  faithPreferredTerminology: document.getElementById("faithPreferredTerminology"),
  faithExplicitLanguage: document.getElementById("faithExplicitLanguage"),
  faithIncludePrayerLanguage: document.getElementById("faithIncludePrayerLanguage"),
  faithIncludeScriptureReferences: document.getElementById("faithIncludeScriptureReferences"),
  saveFaithLanguagePreferencesButton: document.getElementById("saveFaithLanguagePreferencesButton"),
  reportingWindowDays: document.getElementById("reportingWindowDays"),
  refreshReportingOverviewButton: document.getElementById("refreshReportingOverviewButton"),
  reportingSummary: document.getElementById("reportingSummary"),
  refreshPlatformOverviewButton: document.getElementById("refreshPlatformOverviewButton"),
  platformSummary: document.getElementById("platformSummary"),
  platformRequestedTenantId: document.getElementById("platformRequestedTenantId"),
  platformRequestedPracticeName: document.getElementById("platformRequestedPracticeName"),
  platformOwnerEmail: document.getElementById("platformOwnerEmail"),
  createTenantProvisioningButton: document.getElementById("createTenantProvisioningButton"),
  impersonationTargetTenantId: document.getElementById("impersonationTargetTenantId"),
  impersonationTargetRole: document.getElementById("impersonationTargetRole"),
  impersonationReason: document.getElementById("impersonationReason"),
  startImpersonationButton: document.getElementById("startImpersonationButton"),
  endImpersonationSessionId: document.getElementById("endImpersonationSessionId"),
  endImpersonationButton: document.getElementById("endImpersonationButton"),
  exportType: document.getElementById("exportType"),
  exportFormat: document.getElementById("exportFormat"),
  requestDataExportButton: document.getElementById("requestDataExportButton"),
  retentionClinicalRecordsSchedule: document.getElementById("retentionClinicalRecordsSchedule"),
  retentionBillingSchedule: document.getElementById("retentionBillingSchedule"),
  retentionAuditLogSchedule: document.getElementById("retentionAuditLogSchedule"),
  retentionIncludeDocumentVersions: document.getElementById("retentionIncludeDocumentVersions"),
  retentionLegalHoldEnabled: document.getElementById("retentionLegalHoldEnabled"),
  saveRetentionPolicyButton: document.getElementById("saveRetentionPolicyButton"),
  createLocaleButton: document.getElementById("createLocaleButton"),
  autoTranslateButton: document.getElementById("autoTranslateButton"),
  saveTranslationsButton: document.getElementById("saveTranslationsButton"),
  newLocaleCode: document.getElementById("newLocaleCode"),
  newLocaleLabel: document.getElementById("newLocaleLabel"),
  translationSourceLocale: document.getElementById("translationSourceLocale"),
  translationTone: document.getElementById("translationTone"),
  translationFallbackMode: document.getElementById("translationFallbackMode"),
  translationUseGlossary: document.getElementById("translationUseGlossary"),
  translationGlossary: document.getElementById("translationGlossary"),
  saveTranslationConfigButton: document.getElementById("saveTranslationConfigButton")
};
var telemetry = createBrowserTelemetry({ serviceName: "faith-web-ui" });
telemetry.trackVitals(reportVital);
bindEvents();
await initialize();
async function initialize() {
  renderLoadingStates();
  try {
    await loadLocales();
    await loadCatalog(state.locale);
    await refreshDashboardData();
    await loadTranslationLocale(state.locale);
    await refreshTelemetry();
  } catch (error) {
    buildRoleSelect(Object.keys(accessMatrix));
    applyAccessControl("platform_admin");
    setSignedInState(false, "");
    setConnectionStatus(error.message || "Live API unavailable.", "error");
    setManageStatus("Workspace loaded in degraded mode. Start the API to enable mutations and summaries.", "error");
  }
}
function bindEvents() {
  elements.globalSearch?.addEventListener("input", debounce(renderSchedule, 120));
  elements.continueButton?.addEventListener("click", () => {
    const role = elements.roleSelect.value;
    if (!role) return;
    localStorage.setItem(sessionStorageKey, JSON.stringify({ role }));
    applySession(role);
  });
  elements.logoutButton?.addEventListener("click", signOut);
  elements.openPaletteButton?.addEventListener("click", openPalette);
  elements.paletteBackdrop?.addEventListener("click", closePalette);
  elements.paletteInput?.addEventListener("input", renderPalette);
  elements.paletteInput?.addEventListener("keydown", handlePaletteKeydown);
  elements.languageSelect?.addEventListener("change", async () => {
    await loadCatalog(elements.languageSelect.value);
    renderAll();
  });
  elements.translationLocaleSelect?.addEventListener("change", async () => {
    await loadTranslationLocale(elements.translationLocaleSelect.value);
  });
  elements.translationFilter?.addEventListener("input", renderTranslationEditor);
  elements.createLocaleButton?.addEventListener("click", createLocale);
  elements.autoTranslateButton?.addEventListener("click", autoTranslateLocale);
  elements.saveTranslationsButton?.addEventListener("click", saveTranslations);
  elements.saveTranslationConfigButton?.addEventListener("click", saveTranslationConfig);
  elements.createClientButton?.addEventListener("click", createClient);
  elements.updateClientButton?.addEventListener("click", updateClientStatus);
  elements.updateAppointmentButton?.addEventListener("click", updateAppointmentStatus);
  elements.cancelAppointmentButton?.addEventListener("click", cancelAppointment);
  elements.deleteAppointmentButton?.addEventListener("click", deleteAppointment);
  elements.createAppointmentButton?.addEventListener("click", createAppointment);
  elements.createPracticeButton?.addEventListener("click", createPractice);
  elements.updatePracticeButton?.addEventListener("click", updatePractice);
  elements.createLocationButton?.addEventListener("click", createLocation);
  elements.updateLocationButton?.addEventListener("click", updateLocation);
  elements.deleteLocationButton?.addEventListener("click", deleteLocation);
  elements.createStaffButton?.addEventListener("click", createStaffMember);
  elements.updateStaffButton?.addEventListener("click", updateStaffMember);
  elements.saveStaffAvailabilityButton?.addEventListener("click", saveStaffAvailability);
  elements.saveLifecycleButton?.addEventListener("click", saveClientLifecycle);
  elements.createConsentButton?.addEventListener("click", createClientConsent);
  elements.saveIntakePacketButton?.addEventListener("click", saveClientIntakePacket);
  elements.saveTreatmentPlanButton?.addEventListener("click", saveTreatmentPlan);
  elements.createProgressNoteButton?.addEventListener("click", createProgressNote);
  elements.createDocumentTemplateButton?.addEventListener("click", createDocumentTemplate);
  elements.assignDocumentTemplateButton?.addEventListener("click", assignDocumentTemplate);
  elements.createInventoryDefinitionButton?.addEventListener("click", createInventoryDefinition);
  elements.submitInventoryAssignmentButton?.addEventListener("click", submitInventoryAssignment);
  elements.createServiceCodeButton?.addEventListener("click", createServiceCode);
  elements.createFeeScheduleButton?.addEventListener("click", createFeeSchedule);
  elements.createInvoiceButton?.addEventListener("click", createInvoice);
  elements.recordPaymentButton?.addEventListener("click", recordPayment);
  elements.createSuperbillButton?.addEventListener("click", createSuperbill);
  elements.createClaimButton?.addEventListener("click", createClaimPlaceholder);
  elements.refreshAgingReportButton?.addEventListener("click", refreshAgingReport);
  elements.createPortalAccountButton?.addEventListener("click", createPortalAccount);
  elements.refreshPortalOverviewButton?.addEventListener("click", refreshPortalOverviewAction);
  elements.submitPortalIntakeButton?.addEventListener("click", submitPortalIntakePacket);
  elements.signPortalDocumentButton?.addEventListener("click", signPortalDocument);
  elements.createPortalRequestButton?.addEventListener("click", createPortalAppointmentRequest);
  elements.sendPortalMessageButton?.addEventListener("click", sendPortalMessage);
  elements.publishPortalResourceButton?.addEventListener("click", publishPortalResource);
  elements.refreshFaithOverviewButton?.addEventListener("click", refreshFaithOverviewAction);
  elements.createFaithTemplateButton?.addEventListener("click", createFaithNoteTemplate);
  elements.createFaithGoalButton?.addEventListener("click", createFaithGoalTemplate);
  elements.createFaithConsentVariantButton?.addEventListener("click", createFaithConsentVariant);
  elements.createFaithResourceButton?.addEventListener("click", createFaithResource);
  elements.createFaithInventoryButton?.addEventListener("click", createFaithInventory);
  elements.createFaithCoordinationButton?.addEventListener("click", createFaithCoordinationPlan);
  elements.saveFaithLanguagePreferencesButton?.addEventListener("click", saveFaithLanguagePreferences);
  elements.refreshReportingOverviewButton?.addEventListener("click", refreshReportingOverviewAction);
  elements.refreshPlatformOverviewButton?.addEventListener("click", refreshPlatformOverviewAction);
  elements.createTenantProvisioningButton?.addEventListener("click", createTenantProvisioningRequest);
  elements.startImpersonationButton?.addEventListener("click", startSupportImpersonationSession);
  elements.endImpersonationButton?.addEventListener("click", endSupportImpersonationSession);
  elements.requestDataExportButton?.addEventListener("click", requestDataExport);
  elements.saveRetentionPolicyButton?.addEventListener("click", saveRetentionPolicy);
  elements.practiceSelect?.addEventListener("change", syncManageSelections);
  elements.locationSelect?.addEventListener("change", syncManageSelections);
  elements.staffSelect?.addEventListener("change", syncManageSelections);
  elements.lifecycleClientSelect?.addEventListener("change", syncManageSelections);
  elements.chartClientSelect?.addEventListener("change", syncManageSelections);
  elements.documentsClientSelect?.addEventListener("change", syncManageSelections);
  elements.inventoryClientSelect?.addEventListener("change", syncManageSelections);
  elements.portalClientSelect?.addEventListener("change", syncManageSelections);
  elements.faithPracticeSelect?.addEventListener("change", syncManageSelections);
  elements.faithCoordinationClientSelect?.addEventListener("change", syncManageSelections);
  elements.newAppointmentButton?.addEventListener("click", () => {
    setActiveTab("appointments");
    document.getElementById("managePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.newAppointmentClientSelect?.focus();
  });
  elements.refreshTelemetryButton?.addEventListener("click", refreshTelemetry);
  elements.clientSelect?.addEventListener("change", syncManageSelections);
  elements.appointmentSelect?.addEventListener("change", syncManageSelections);
  document.querySelectorAll("[data-nav-key]").forEach((button) => {
    button.addEventListener("click", () => handlePrimaryNavigation(button.getAttribute("data-nav-key")));
  });
  document.querySelectorAll("a.nav-link[href]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      window.location.assign(href);
    });
  });
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.getAttribute("data-tab")));
    button.addEventListener("keydown", handleTabListKeydown);
  });
  document.addEventListener("keydown", handleKeyboardShortcuts);
}
function handlePrimaryNavigation(navKey) {
  if (!navKey) return;
  if (navKey === "dashboard") {
    syncPrimaryNavigation("dashboard");
    document.getElementById("mainContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const tabName = navToTabMap[navKey];
  if (!tabName) return;
  setActiveTab(tabName);
  document.getElementById("managePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
function handleTabListKeydown(event) {
  const visibleButtons = getVisibleTabButtons();
  if (!visibleButtons.length) return;
  const currentIndex = visibleButtons.findIndex((button) => button === event.currentTarget);
  if (currentIndex === -1) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + direction + visibleButtons.length) % visibleButtons.length;
    visibleButtons[nextIndex].focus();
    setActiveTab(visibleButtons[nextIndex].getAttribute("data-tab"));
    return;
  }
  if (event.key === "Home") {
    event.preventDefault();
    visibleButtons[0].focus();
    setActiveTab(visibleButtons[0].getAttribute("data-tab"));
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    const lastButton = visibleButtons[visibleButtons.length - 1];
    lastButton.focus();
    setActiveTab(lastButton.getAttribute("data-tab"));
  }
}
function handlePaletteKeydown(event) {
  if (event.key !== "Enter") return;
  const firstButton = elements.paletteList?.querySelector("button");
  if (!firstButton) return;
  event.preventDefault();
  firstButton.click();
}
function handleKeyboardShortcuts(event) {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const openCombo = isMac ? event.metaKey && event.key.toLowerCase() === "k" : event.ctrlKey && event.key.toLowerCase() === "k";
  if (openCombo) {
    event.preventDefault();
    openPalette();
    return;
  }
  if (event.key === "/" && document.activeElement !== elements.globalSearch && !isTypingElement(document.activeElement)) {
    event.preventDefault();
    elements.globalSearch?.focus();
    return;
  }
  if (event.key === "Escape" && elements.commandPalette?.classList.contains("visible")) {
    closePalette();
  }
}
async function loadLocales() {
  const response = await fetchJson("/api/v1/i18n/locales");
  state.locales = response.items ?? [];
  populateLocaleSelect(elements.languageSelect, state.locales, state.locale);
  populateLocaleSelect(elements.translationLocaleSelect, state.locales, state.locale);
}
async function loadCatalog(locale) {
  const catalog = await fetchJson(`/api/v1/i18n/catalog?locale=${encodeURIComponent(locale)}`);
  state.locale = catalog.locale;
  state.messages = buildLocaleCatalog(catalog.messages ?? {});
  document.documentElement.lang = state.locale;
  populateLocaleSelect(elements.languageSelect, state.locales, state.locale);
  applyTranslations();
}
async function loadTranslationLocale(locale) {
  setLanguageStatus(t2("message.loadingTranslations"));
  const catalog = await fetchJson(`/api/v1/i18n/catalog?locale=${encodeURIComponent(locale)}`);
  const settingsPayload = await fetchJson(`/api/v1/i18n/settings/${encodeURIComponent(locale)}`);
  state.translationCatalog = catalog;
  state.translationDraft = { ...catalog.messages };
  state.translationSettings = {
    ...state.translationSettings,
    ...settingsPayload.settings ?? {}
  };
  populateLocaleSelect(elements.translationLocaleSelect, state.locales, catalog.locale);
  applyTranslationSettingsToControls();
  renderTranslationEditor();
  setLanguageStatus(t2("message.localeLoaded"));
}
async function refreshDashboardData() {
  const [
    health,
    metadata2,
    clientsPayload,
    appointmentTypesPayload,
    appointmentsPayload,
    practicesPayload,
    locationsPayload,
    staffPayload,
    documentTemplatesPayload,
    documentAssignmentsPayload,
    inventoryDefinitionsPayload,
    inventoryAssignmentsPayload,
    serviceCodesPayload,
    feeSchedulesPayload,
    invoicesPayload,
    paymentsPayload,
    superbillsPayload,
    claimPlaceholdersPayload,
    agingReportPayload,
    portalOverviewPayload,
    faithOverviewPayload,
    reportingOverviewPayload,
    platformOverviewPayload,
    operationsSummaryPayload
  ] = await Promise.all([
    fetchJson("/api/health"),
    fetchJson("/api/bootstrap-metadata"),
    fetchJson("/api/v1/clients"),
    fetchJson("/api/v1/appointment-types"),
    fetchJson("/api/v1/appointments"),
    fetchJson("/api/v1/practices"),
    fetchJson("/api/v1/locations"),
    fetchJson("/api/v1/staff"),
    fetchJson("/api/v1/document-templates"),
    fetchJson("/api/v1/document-assignments"),
    fetchJson("/api/v1/inventory-definitions"),
    fetchJson("/api/v1/inventory-assignments"),
    fetchJson("/api/v1/billing/service-codes"),
    fetchJson("/api/v1/billing/fee-schedules"),
    fetchJson("/api/v1/billing/invoices"),
    fetchJson("/api/v1/billing/payments"),
    fetchJson("/api/v1/billing/superbills"),
    fetchJson("/api/v1/billing/claims"),
    fetchJson("/api/v1/billing/reports/aging").catch(() => ({ report: null })),
    fetchJson("/api/v1/portal/overview").catch(() => ({})),
    fetchJson("/api/v1/faith/overview").catch(() => ({})),
    fetchJson("/api/v1/reporting/overview").catch(() => ({ summary: null })),
    fetchJson("/api/v1/platform/overview").catch(() => ({ summary: null })),
    fetchJson("/api/v1/operations/summary").catch(() => ({ summary: null }))
  ]);
  state.clients = clientsPayload.items ?? [];
  state.appointmentTypes = appointmentTypesPayload.items ?? [];
  state.appointments = appointmentsPayload.items ?? [];
  state.practices = practicesPayload.items ?? [];
  state.locations = locationsPayload.items ?? [];
  state.staff = staffPayload.items ?? [];
  state.documentTemplates = documentTemplatesPayload.items ?? [];
  state.documentAssignments = documentAssignmentsPayload.items ?? [];
  state.inventoryDefinitions = inventoryDefinitionsPayload.items ?? [];
  state.inventoryAssignments = inventoryAssignmentsPayload.items ?? [];
  state.serviceCodes = serviceCodesPayload.items ?? [];
  state.feeSchedules = feeSchedulesPayload.items ?? [];
  state.invoices = invoicesPayload.items ?? [];
  state.payments = paymentsPayload.items ?? [];
  state.superbills = superbillsPayload.items ?? [];
  state.claimPlaceholders = claimPlaceholdersPayload.items ?? [];
  state.agingReport = agingReportPayload.report ?? null;
  applyPortalOverview(portalOverviewPayload);
  applyFaithOverview(faithOverviewPayload);
  applyReportingOverview(reportingOverviewPayload);
  applyPlatformOverview(platformOverviewPayload);
  state.operationsSummary = operationsSummaryPayload.summary ?? null;
  setConnectionStatus(`Live API connected \xB7 ${health.service} \xB7 ${formatTime(health.timestamp)}`, "connected");
  elements.metricSessionsValue.textContent = `${state.appointments.length}`;
  elements.metricSessionsMeta.textContent = `${countByStatus(state.appointments, "scheduled")} ${t2("status.scheduled").toLowerCase()} today`;
  elements.metricRolesValue.textContent = `${metadata2.roles.length}`;
  elements.metricRolesMeta.textContent = "Loaded from live bootstrap metadata";
  elements.metricApptValue.textContent = `${(metadata2.appointmentTypes ?? []).length}`;
  elements.metricApptMeta.textContent = "Appointment type model is in sync";
  elements.metricAuditValue.textContent = "Synced";
  elements.metricAuditMeta.textContent = `Last event \xB7 ${formatTime(metadata2.bootstrapEvent.occurredAt)}`;
  buildRoleSelect(metadata2.roles);
  populateStatusSelect(elements.newClientStatusSelect, ["active", "waitlist", "inactive", "discharged"]);
  populateStatusSelect(elements.clientStatusSelect, ["active", "waitlist", "inactive", "discharged"]);
  populateStatusSelect(elements.appointmentStatusSelect, ["scheduled", "checked_in", "completed", "cancelled", "no_show"]);
  populateGenericSelect(elements.appointmentTypeSelect, state.appointmentTypes, (item) => item.label, (item) => item.code);
  populateGenericSelect(elements.newAppointmentTypeSelect, state.appointmentTypes, (item) => item.label, (item) => item.code);
  populateGenericSelect(elements.newStaffRole, metadata2.roles ?? [], (role) => prettifyRole(role), (role) => role);
  populateGenericSelect(elements.staffRole, metadata2.roles ?? [], (role) => prettifyRole(role), (role) => role);
  populateManageSelects();
  const lifecycleClientId = state.activeLifecycleClientId || state.clients[0]?.id;
  const chartClientId = state.activeChartClientId || state.clients[0]?.id;
  if (lifecycleClientId) {
    await loadClientContext(lifecycleClientId, true);
  }
  if (chartClientId && chartClientId !== lifecycleClientId) {
    await loadClientContext(chartClientId, true);
  }
  const savedSession = readSession();
  if (savedSession?.role) {
    applySession(savedSession.role);
  } else {
    applyAccessControl("platform_admin");
    setSignedInState(false, "");
  }
  renderAll();
}
elements.metricApptValue.textContent = `${state.appointmentTypes.length || (metadata.appointmentTypes ?? []).length}`;
function renderAll() {
  renderSchedule();
  renderPriority();
  renderCompliance();
  renderBillingSummary();
  renderPortalSummary();
  renderFaithSummary();
  renderReportingOpsSummary();
  renderPalette();
  renderTelemetry();
  syncManageSelections();
  syncPrimaryNavigation();
}
function renderSchedule() {
  const query = (elements.globalSearch?.value ?? "").toLowerCase().trim();
  const scheduleSource = state.operationsSummary?.todaySchedule?.items?.length ? state.operationsSummary.todaySchedule.items : state.appointments;
  state.activeScheduleItems = scheduleSource.map((appointment) => ({
    title: `${appointment.clientName} \u2014 ${t2(`status.${appointment.status}`)}`,
    detail: `${formatTime(appointment.startsAt)} \xB7 ${appointment.remoteSession ? t2("form.remoteSession") : appointment.locationName} \xB7 Counselor: ${appointment.counselorName}${appointment.timezone ? ` \xB7 ${appointment.timezone}` : ""}`
  }));
  const items = query ? state.activeScheduleItems.filter((item) => item.title.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query)) : state.activeScheduleItems;
  renderList(elements.timelineList, items);
}
function renderPriority() {
  const items = state.operationsSummary?.priorityItems;
  if (Array.isArray(items) && items.length) {
    renderList(elements.priorityList, items);
    return;
  }
  const waitlistCount = countByStatus(state.clients, "waitlist");
  renderList(elements.priorityList, [
    { title: "Waitlist follow-ups", detail: `${waitlistCount} clients currently in intake waitlist stage.` }
  ]);
}
function renderCompliance() {
  const items = state.operationsSummary?.complianceItems;
  if (Array.isArray(items) && items.length) {
    renderList(elements.complianceList, items);
    return;
  }
  const dischargedCount = countByStatus(state.clients, "discharged");
  renderList(elements.complianceList, [
    { title: "Discharge documentation checks", detail: `${dischargedCount} discharged charts should be retention-reviewed this week.` }
  ]);
}
function renderList(element, items) {
  if (!element) return;
  element.innerHTML = "";
  element.setAttribute("aria-busy", "false");
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.innerHTML = `<h3>${t2("state.noResults")}</h3><p>${t2("state.tryBroader")}</p>`;
    element.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<h3>${item.title}</h3><p>${item.detail}</p>`;
    element.appendChild(li);
  });
}
function renderLoadingStates() {
  [elements.timelineList, elements.priorityList, elements.complianceList].forEach((list) => {
    if (!list) return;
    list.innerHTML = `<li class="empty-state"><h3>${t2("state.loading")}</h3><p>${t2("state.loadingDashboard")}</p></li>`;
  });
}
function populateManageSelects() {
  populateGenericSelect(elements.clientSelect, state.clients, (client) => `${client.firstName} ${client.lastName} (${t2(`status.${client.status}`)})`, (client) => client.id);
  populateGenericSelect(elements.newAppointmentClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.appointmentSelect, state.appointments, (appointment) => `${appointment.clientName} \xB7 ${formatTime(appointment.startsAt)} \xB7 ${t2(`status.${appointment.status}`)}`, (appointment) => appointment.id);
  populateGenericSelect(elements.practiceSelect, state.practices, (practice) => `${practice.name} (${practice.type})`, (practice) => practice.id);
  populateGenericSelect(elements.locationSelect, state.locations, (location2) => `${location2.name}${location2.remoteEnabled ? " \xB7 Remote" : ""}`, (location2) => location2.id);
  populateGenericSelect(elements.staffSelect, state.staff, (member) => `${member.firstName} ${member.lastName} \xB7 ${prettifyRole(member.role)}`, (member) => member.id);
  populateGenericSelect(elements.lifecycleClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.chartClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.documentsClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.inventoryClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(
    elements.documentTemplateSelect,
    state.documentTemplates,
    (template) => `${template.title} (v${template.versionNumber})`,
    (template) => template.id
  );
  populateGenericSelect(
    elements.inventoryDefinitionSelect,
    state.inventoryDefinitions,
    (inventory) => `${inventory.name} (${inventory.category})`,
    (inventory) => inventory.id
  );
  populateGenericSelect(elements.billingClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(
    elements.billingInvoiceServiceCodeSelect,
    state.serviceCodes,
    (serviceCode) => `${serviceCode.code} \xB7 ${serviceCode.name}`,
    (serviceCode) => serviceCode.id
  );
  populateGenericSelect(
    elements.billingInvoiceSelect,
    state.invoices,
    (invoice) => `${invoice.id} \xB7 ${invoice.clientId} \xB7 $${Number(invoice.balance ?? 0).toFixed(2)} (${invoice.status})`,
    (invoice) => invoice.id
  );
  populateGenericSelect(elements.portalClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.faithCoordinationClientSelect, state.clients, (client) => `${client.firstName} ${client.lastName}`, (client) => client.id);
  populateGenericSelect(elements.faithPracticeSelect, state.practices, (practice) => practice.name, (practice) => practice.id);
  populateGenericSelect(
    elements.portalDocumentSelect,
    state.portalDocuments,
    (item) => `${item.templateTitle ?? "Document"} \xB7 ${item.status}`,
    (item) => item.id
  );
  populateGenericSelect(
    elements.portalMessageThreadSelect,
    state.portalMessageThreads,
    (thread) => `${thread.subject} (${thread.messageCount ?? 0})`,
    (thread) => thread.id
  );
}
function syncManageSelections() {
  const selectedClient = state.clients.find((item) => item.id === elements.clientSelect?.value) ?? state.clients[0];
  if (selectedClient && elements.clientStatusSelect) {
    elements.clientStatusSelect.value = selectedClient.status;
  }
  const selectedAppointment = state.appointments.find((item) => item.id === elements.appointmentSelect?.value) ?? state.appointments[0];
  if (selectedAppointment && elements.appointmentStatusSelect) {
    elements.appointmentStatusSelect.value = selectedAppointment.status;
  }
  if (selectedAppointment && elements.appointmentTypeSelect) {
    elements.appointmentTypeSelect.value = selectedAppointment.appointmentType ?? "individual_therapy";
  }
  const selectedPractice = state.practices.find((item) => item.id === elements.practiceSelect?.value) ?? state.practices[0];
  if (selectedPractice) {
    if (elements.practiceSelect && !elements.practiceSelect.value) elements.practiceSelect.value = selectedPractice.id;
    if (elements.practiceName) elements.practiceName.value = selectedPractice.name ?? "";
    if (elements.practiceFaithTradition) elements.practiceFaithTradition.value = selectedPractice.faithTradition ?? "";
    if (elements.practiceContactEmail) elements.practiceContactEmail.value = selectedPractice.contactEmail ?? "";
  }
  const selectedLocation = state.locations.find((item) => item.id === elements.locationSelect?.value) ?? state.locations[0];
  if (selectedLocation) {
    if (elements.locationSelect && !elements.locationSelect.value) elements.locationSelect.value = selectedLocation.id;
    if (elements.locationName) elements.locationName.value = selectedLocation.name ?? "";
    if (elements.locationAddress) elements.locationAddress.value = selectedLocation.address ?? "";
    if (elements.locationCapacity) elements.locationCapacity.value = String(selectedLocation.capacity ?? 1);
    if (elements.locationRemoteEnabled) elements.locationRemoteEnabled.checked = Boolean(selectedLocation.remoteEnabled);
  }
  const selectedStaff = state.staff.find((item) => item.id === elements.staffSelect?.value) ?? state.staff[0];
  if (selectedStaff) {
    if (elements.staffSelect && !elements.staffSelect.value) elements.staffSelect.value = selectedStaff.id;
    if (elements.staffRole) elements.staffRole.value = selectedStaff.role;
    if (elements.staffLicenseType) elements.staffLicenseType.value = selectedStaff.licenseType ?? "pastoral_counselor";
    if (elements.staffSupervisionStatus) elements.staffSupervisionStatus.value = selectedStaff.supervisionStatus ?? "not_required";
    loadSelectedStaffAvailability(selectedStaff.id);
  } else if (elements.staffAvailabilityTemplate) {
    elements.staffAvailabilityTemplate.value = "";
  }
  const selectedLifecycleClient = state.clients.find((item) => item.id === elements.lifecycleClientSelect?.value) ?? state.clients[0];
  if (selectedLifecycleClient) {
    if (elements.lifecycleClientSelect && !elements.lifecycleClientSelect.value) elements.lifecycleClientSelect.value = selectedLifecycleClient.id;
    if (state.activeLifecycleClientId !== selectedLifecycleClient.id) {
      state.activeLifecycleClientId = selectedLifecycleClient.id;
      void loadClientContext(selectedLifecycleClient.id);
    } else {
      applyLifecycleFields(selectedLifecycleClient.id);
      applyIntakeFields(selectedLifecycleClient.id);
    }
  }
  const selectedChartClient = state.clients.find((item) => item.id === elements.chartClientSelect?.value) ?? state.clients[0];
  if (selectedChartClient) {
    if (elements.chartClientSelect && !elements.chartClientSelect.value) elements.chartClientSelect.value = selectedChartClient.id;
    if (state.activeChartClientId !== selectedChartClient.id) {
      state.activeChartClientId = selectedChartClient.id;
      void loadClientContext(selectedChartClient.id);
    } else {
      applyTreatmentPlanFields(selectedChartClient.id);
    }
  }
  const selectedDocumentsClient = state.clients.find((item) => item.id === elements.documentsClientSelect?.value) ?? state.clients[0];
  if (selectedDocumentsClient && elements.documentsClientSelect && !elements.documentsClientSelect.value) {
    elements.documentsClientSelect.value = selectedDocumentsClient.id;
  }
  const selectedInventoryClient = state.clients.find((item) => item.id === elements.inventoryClientSelect?.value) ?? state.clients[0];
  if (selectedInventoryClient && elements.inventoryClientSelect && !elements.inventoryClientSelect.value) {
    elements.inventoryClientSelect.value = selectedInventoryClient.id;
  }
  const selectedPortalClient = state.clients.find((item) => item.id === elements.portalClientSelect?.value) ?? state.clients[0];
  if (selectedPortalClient) {
    if (elements.portalClientSelect && !elements.portalClientSelect.value) elements.portalClientSelect.value = selectedPortalClient.id;
    if (state.activePortalClientId !== selectedPortalClient.id) {
      state.activePortalClientId = selectedPortalClient.id;
      void refreshPortalOverviewForClient(selectedPortalClient.id, true);
    }
  }
  const selectedFaithPractice = state.practices.find((item) => item.id === elements.faithPracticeSelect?.value) ?? state.practices[0];
  if (selectedFaithPractice) {
    if (elements.faithPracticeSelect && !elements.faithPracticeSelect.value) elements.faithPracticeSelect.value = selectedFaithPractice.id;
    if (state.activeFaithPracticeId !== selectedFaithPractice.id) {
      state.activeFaithPracticeId = selectedFaithPractice.id;
      void refreshFaithOverviewForPractice(selectedFaithPractice.id, true);
    }
  }
  const selectedFaithClient = state.clients.find((item) => item.id === elements.faithCoordinationClientSelect?.value) ?? state.clients[0];
  if (selectedFaithClient && elements.faithCoordinationClientSelect && !elements.faithCoordinationClientSelect.value) {
    elements.faithCoordinationClientSelect.value = selectedFaithClient.id;
  }
  const selectedReportingTenant = selectedPractice?.tenantId ?? "system";
  if (selectedReportingTenant) {
    state.activeReportingTenantId = selectedReportingTenant;
    if (elements.platformRequestedTenantId && !elements.platformRequestedTenantId.value) {
      elements.platformRequestedTenantId.value = selectedReportingTenant;
    }
    if (elements.impersonationTargetTenantId && !elements.impersonationTargetTenantId.value) {
      elements.impersonationTargetTenantId.value = selectedReportingTenant;
    }
  }
}
function applyPortalOverview(payload) {
  const clientId = payload?.client?.id;
  if (clientId) {
    state.activePortalClientId = clientId;
  }
  state.portalAccount = payload?.account ?? null;
  state.portalForms = payload?.forms ?? [];
  state.portalDocuments = payload?.documents ?? [];
  state.portalBalances = payload?.balances ?? null;
  state.portalResources = payload?.resources ?? [];
  state.portalMessageThreads = payload?.messageThreads ?? [];
  state.portalAppointmentRequests = payload?.appointmentRequests ?? [];
}
function applyFaithOverview(payload) {
  state.faithNoteTemplates = payload?.noteTemplates ?? [];
  state.faithTreatmentGoals = payload?.treatmentGoals ?? [];
  state.faithConsentVariants = payload?.consentVariants ?? [];
  state.faithResources = payload?.resources ?? [];
  state.faithInventories = payload?.inventories ?? [];
  state.faithReferralCoordinations = payload?.referralCoordinations ?? [];
  state.faithLanguagePreference = payload?.languagePreference ?? null;
}
function applyReportingOverview(payload) {
  state.reportingOverview = payload?.summary ?? null;
}
function applyPlatformOverview(payload) {
  state.platformOverview = payload?.summary ?? null;
}
async function refreshPortalOverviewForClient(clientId, silent = false) {
  if (!clientId) return;
  try {
    const payload = await fetchJson(`/api/v1/portal/overview?clientId=${encodeURIComponent(clientId)}`);
    applyPortalOverview(payload);
    populateManageSelects();
    renderPortalSummary();
    if (!silent) setManageStatus("Portal summary refreshed.");
  } catch (error) {
    if (!silent) setManageStatus(error.message || "Unable to load portal summary.");
  }
}
async function refreshFaithOverviewForPractice(practiceId, silent = false) {
  if (!practiceId) return;
  try {
    const payload = await fetchJson(`/api/v1/faith/overview?practiceId=${encodeURIComponent(practiceId)}`);
    state.activeFaithPracticeId = practiceId;
    applyFaithOverview(payload);
    renderFaithSummary();
    if (!silent) setManageStatus("Faith workflow summary refreshed.");
  } catch (error) {
    if (!silent) setManageStatus(error.message || "Unable to load faith workflow summary.");
  }
}
async function loadClientContext(clientId, force = false) {
  if (!clientId) return;
  if (!force && state.clientLifecycle[clientId]) {
    applyLifecycleFields(clientId);
    applyIntakeFields(clientId);
    applyTreatmentPlanFields(clientId);
    return;
  }
  try {
    const [lifecyclePayload, consentPayload, intakePayload, treatmentPlanPayload, progressNotesPayload] = await Promise.all([
      fetchJson(`/api/v1/clients/${encodeURIComponent(clientId)}/lifecycle`),
      fetchJson(`/api/v1/clients/${encodeURIComponent(clientId)}/consents`),
      fetchJson(`/api/v1/clients/${encodeURIComponent(clientId)}/intake-packets`),
      fetchJson(`/api/v1/clients/${encodeURIComponent(clientId)}/treatment-plan`),
      fetchJson(`/api/v1/clients/${encodeURIComponent(clientId)}/progress-notes`)
    ]);
    state.clientLifecycle[clientId] = lifecyclePayload.item ?? null;
    state.clientConsents[clientId] = consentPayload.items ?? [];
    state.clientIntakePackets[clientId] = intakePayload.items ?? [];
    state.clientTreatmentPlans[clientId] = treatmentPlanPayload.item ?? null;
    state.clientProgressNotes[clientId] = progressNotesPayload.items ?? [];
    applyLifecycleFields(clientId);
    applyIntakeFields(clientId);
    applyTreatmentPlanFields(clientId);
  } catch {
  }
}
function applyLifecycleFields(clientId) {
  const lifecycle = state.clientLifecycle[clientId];
  if (!lifecycle) return;
  if (elements.lifecycleCaseStatus) elements.lifecycleCaseStatus.value = lifecycle.caseStatus ?? "active";
  if (elements.lifecycleReferralSource) elements.lifecycleReferralSource.value = lifecycle.referralSource ?? "";
  if (elements.lifecycleEmergencyName) elements.lifecycleEmergencyName.value = lifecycle.emergencyContact?.name ?? "";
  if (elements.lifecycleEmergencyRelationship) elements.lifecycleEmergencyRelationship.value = lifecycle.emergencyContact?.relationship ?? "";
  if (elements.lifecycleEmergencyPhone) elements.lifecycleEmergencyPhone.value = lifecycle.emergencyContact?.phone ?? "";
  if (elements.lifecycleEmergencyAuthorized) elements.lifecycleEmergencyAuthorized.checked = Boolean(lifecycle.emergencyContact?.authorized);
}
function applyIntakeFields(clientId) {
  const latestPacket = (state.clientIntakePackets[clientId] ?? [])[0];
  if (!latestPacket) return;
  if (elements.intakeStatus) elements.intakeStatus.value = latestPacket.status ?? "assigned";
  if (elements.intakeAssignedForms) {
    elements.intakeAssignedForms.value = Array.isArray(latestPacket.assignedForms) ? latestPacket.assignedForms.join("\n") : "";
  }
}
function applyTreatmentPlanFields(clientId) {
  const plan = state.clientTreatmentPlans[clientId];
  if (!plan) return;
  if (elements.treatmentPlanStatus) elements.treatmentPlanStatus.value = plan.status ?? "draft";
  if (elements.treatmentPlanGoals) elements.treatmentPlanGoals.value = Array.isArray(plan.goals) ? plan.goals.join("\n") : "";
  if (elements.treatmentPlanInterventions) {
    elements.treatmentPlanInterventions.value = Array.isArray(plan.interventions) ? plan.interventions.join("\n") : "";
  }
}
async function loadSelectedStaffAvailability(staffId) {
  if (!staffId || !elements.staffAvailabilityTemplate) return;
  try {
    const payload = await fetchJson(`/api/v1/staff/${encodeURIComponent(staffId)}/availability`);
    state.staffAvailability = payload.template ?? [];
    elements.staffAvailabilityTemplate.value = state.staffAvailability.map((entry) => `${entry.day},${entry.start},${entry.end}`).join("\n");
  } catch {
    elements.staffAvailabilityTemplate.value = "";
  }
}
function populateGenericSelect(selectElement, items, labelBuilder, valueBuilder) {
  if (!selectElement) return;
  const previous = selectElement.value;
  selectElement.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = valueBuilder(item);
    option.textContent = labelBuilder(item);
    selectElement.appendChild(option);
  });
  if (!items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No records available";
    selectElement.appendChild(option);
    selectElement.disabled = true;
  } else {
    selectElement.disabled = false;
    if (previous && items.some((item) => valueBuilder(item) === previous)) {
      selectElement.value = previous;
    }
  }
}
function populateStatusSelect(selectElement, statuses) {
  if (!selectElement) return;
  const previous = selectElement.value;
  selectElement.innerHTML = "";
  statuses.forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = t2(`status.${status}`);
    selectElement.appendChild(option);
  });
  if (previous && statuses.includes(previous)) {
    selectElement.value = previous;
  }
}
async function createClient() {
  clearFieldErrors(["newClientFirstName", "newClientLastName"]);
  const firstName = elements.newClientFirstName.value.trim();
  const lastName = elements.newClientLastName.value.trim();
  if (!firstName) setFieldError("newClientFirstName", t2("message.enterClientName"));
  if (!lastName) setFieldError("newClientLastName", t2("message.enterClientName"));
  if (!firstName || !lastName) return;
  await runMutation(async () => {
    const payload = await postJson("/api/v1/clients", {
      firstName,
      lastName,
      faithBackground: elements.newClientFaithBackground.value.trim() || "Undeclared",
      status: elements.newClientStatusSelect.value || "active"
    }, "POST");
    elements.newClientFirstName.value = "";
    elements.newClientLastName.value = "";
    elements.newClientFaithBackground.value = "";
    elements.newClientStatusSelect.value = "active";
    setManageStatus(t2("message.clientCreated", { name: `${payload.item.firstName} ${payload.item.lastName}` }));
  });
}
async function updateClientStatus() {
  const clientId = elements.clientSelect.value;
  const status = elements.clientStatusSelect.value;
  if (!clientId || !status) {
    setManageStatus(t2("message.selectClient"));
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}`, { status }, "PATCH");
    setManageStatus(t2("message.clientUpdated"));
  });
}
async function updateAppointmentStatus() {
  const appointmentId = elements.appointmentSelect.value;
  const status = elements.appointmentStatusSelect.value;
  const appointmentType = elements.appointmentTypeSelect?.value;
  if (!appointmentId || !status || !appointmentType) {
    setManageStatus(t2("message.selectAppointment"));
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/appointments/${appointmentId}`, { status, appointmentType }, "PATCH");
    setManageStatus(t2("message.appointmentUpdated"));
  });
}
async function cancelAppointment() {
  const appointmentId = elements.appointmentSelect.value;
  if (!appointmentId || !window.confirm(t2("message.cancelConfirm"))) return;
  await runMutation(async () => {
    await postJson(`/api/v1/appointments/${appointmentId}`, { status: "cancelled" }, "PATCH");
    setManageStatus(t2("message.appointmentCancelled"));
  });
}
async function deleteAppointment() {
  const appointmentId = elements.appointmentSelect.value;
  if (!appointmentId || !window.confirm(t2("message.deleteConfirm"))) return;
  await runMutation(async () => {
    await fetchJson(`/api/v1/appointments/${appointmentId}`, { method: "DELETE" });
    setManageStatus(t2("message.appointmentDeleted"));
  });
}
async function createAppointment() {
  clearFieldErrors(["newAppointmentClient", "newAppointmentStart", "newAppointmentEnd"]);
  const clientId = elements.newAppointmentClientSelect.value;
  const startsAt = toIsoDate(elements.newAppointmentStart.value);
  const endsAt = toIsoDate(elements.newAppointmentEnd.value);
  const appointmentType = elements.newAppointmentTypeSelect?.value || "individual_therapy";
  let valid = true;
  if (!clientId) {
    setFieldError("newAppointmentClient", t2("message.chooseAppointmentTime"));
    valid = false;
  }
  if (!startsAt) {
    setFieldError("newAppointmentStart", t2("message.chooseAppointmentTime"));
    valid = false;
  }
  if (!endsAt) {
    setFieldError("newAppointmentEnd", t2("message.chooseAppointmentTime"));
    valid = false;
  }
  if (!valid) return;
  await runMutation(async () => {
    const timezone = state.practices.find((practice) => practice.id === elements.practiceSelect?.value)?.timezone || state.practices[0]?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
    await postJson("/api/v1/appointments", {
      clientId,
      startsAt,
      endsAt,
      appointmentType,
      counselorName: elements.newAppointmentCounselor.value.trim() || "Unassigned Counselor",
      locationName: elements.newAppointmentLocation.value.trim() || (elements.newAppointmentRemote.checked ? "Remote Session" : "Main Office"),
      remoteSession: elements.newAppointmentRemote.checked,
      timezone,
      status: "scheduled"
    }, "POST");
    elements.newAppointmentCounselor.value = "";
    elements.newAppointmentLocation.value = "";
    elements.newAppointmentRemote.checked = false;
    elements.newAppointmentStart.value = "";
    elements.newAppointmentEnd.value = "";
    if (elements.newAppointmentTypeSelect) elements.newAppointmentTypeSelect.value = "individual_therapy";
    setManageStatus(t2("message.appointmentCreated"));
  });
}
async function createPractice() {
  await runMutation(async () => {
    await postJson("/api/v1/practices", {
      name: elements.newPracticeName.value.trim(),
      type: elements.newPracticeType.value,
      timezone: elements.newPracticeTimezone.value.trim() || "America/New_York"
    }, "POST");
    elements.newPracticeName.value = "";
    setManageStatus("Practice created.");
  });
}
async function updatePractice() {
  const practiceId = elements.practiceSelect.value;
  if (!practiceId) {
    setManageStatus("Select a practice first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/practices/${practiceId}`, {
      name: elements.practiceName.value.trim(),
      faithTradition: elements.practiceFaithTradition.value.trim(),
      contactEmail: elements.practiceContactEmail.value.trim()
    }, "PATCH");
    setManageStatus("Practice updated.");
  });
}
async function createLocation() {
  await runMutation(async () => {
    await postJson("/api/v1/locations", {
      name: elements.newLocationName.value.trim(),
      address: elements.newLocationAddress.value.trim(),
      capacity: Number(elements.newLocationCapacity.value || 1),
      remoteEnabled: Boolean(elements.newLocationRemoteEnabled.checked),
      practiceId: elements.practiceSelect.value
    }, "POST");
    elements.newLocationName.value = "";
    elements.newLocationAddress.value = "";
    elements.newLocationCapacity.value = "1";
    elements.newLocationRemoteEnabled.checked = false;
    setManageStatus("Location created.");
  });
}
async function updateLocation() {
  const locationId = elements.locationSelect.value;
  if (!locationId) {
    setManageStatus("Select a location first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/locations/${locationId}`, {
      name: elements.locationName.value.trim(),
      address: elements.locationAddress.value.trim(),
      capacity: Number(elements.locationCapacity.value || 1),
      remoteEnabled: Boolean(elements.locationRemoteEnabled.checked)
    }, "PATCH");
    setManageStatus("Location updated.");
  });
}
async function deleteLocation() {
  const locationId = elements.locationSelect.value;
  if (!locationId || !window.confirm("Delete this location?")) return;
  await runMutation(async () => {
    await fetchJson(`/api/v1/locations/${locationId}`, { method: "DELETE", headers: requestHeaders() });
    setManageStatus("Location deleted.");
  });
}
async function createStaffMember() {
  await runMutation(async () => {
    await postJson("/api/v1/staff", {
      firstName: elements.newStaffFirstName.value.trim(),
      lastName: elements.newStaffLastName.value.trim(),
      role: elements.newStaffRole.value,
      licenseType: elements.newStaffLicenseType.value,
      supervisionStatus: elements.newStaffSupervisionStatus.value
    }, "POST");
    elements.newStaffFirstName.value = "";
    elements.newStaffLastName.value = "";
    setManageStatus("Staff member created.");
  });
}
async function updateStaffMember() {
  const staffId = elements.staffSelect.value;
  if (!staffId) {
    setManageStatus("Select a staff member first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/staff/${staffId}`, {
      role: elements.staffRole.value,
      licenseType: elements.staffLicenseType.value,
      supervisionStatus: elements.staffSupervisionStatus.value
    }, "PATCH");
    setManageStatus("Staff member updated.");
  });
}
async function saveStaffAvailability() {
  const staffId = elements.staffSelect.value;
  if (!staffId) {
    setManageStatus("Select a staff member first.");
    return;
  }
  const template = (elements.staffAvailabilityTemplate.value || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [day, start, end] = line.split(",").map((part) => part?.trim());
    return { day, start, end };
  }).filter((entry) => entry.day && entry.start && entry.end);
  await runMutation(async () => {
    await postJson(`/api/v1/staff/${staffId}/availability`, { template }, "POST");
    setManageStatus("Staff availability saved.");
  });
}
async function saveClientLifecycle() {
  const clientId = elements.lifecycleClientSelect.value;
  if (!clientId) {
    setManageStatus("Select a client first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}/lifecycle`, {
      caseStatus: elements.lifecycleCaseStatus.value,
      referralSource: elements.lifecycleReferralSource.value.trim(),
      emergencyContact: {
        name: elements.lifecycleEmergencyName.value.trim(),
        relationship: elements.lifecycleEmergencyRelationship.value.trim(),
        phone: elements.lifecycleEmergencyPhone.value.trim(),
        authorized: Boolean(elements.lifecycleEmergencyAuthorized.checked)
      },
      dischargeReason: elements.lifecycleCaseStatus.value === "discharged" ? "Case closed by clinician" : void 0
    }, "PATCH");
    await loadClientContext(clientId, true);
    setManageStatus("Client lifecycle saved.");
  });
}
async function createClientConsent() {
  const clientId = elements.lifecycleClientSelect.value;
  if (!clientId) {
    setManageStatus("Select a client first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}/consents`, {
      consentType: elements.consentType.value,
      signatureState: elements.consentSignatureState.value,
      version: elements.consentVersion.value.trim() || "v1",
      effectiveFrom: (/* @__PURE__ */ new Date()).toISOString()
    }, "POST");
    await loadClientContext(clientId, true);
    const total = state.clientConsents[clientId]?.length ?? 0;
    setManageStatus(`Consent created. Total consents: ${total}.`);
  });
}
async function saveClientIntakePacket() {
  const clientId = elements.lifecycleClientSelect.value;
  if (!clientId) {
    setManageStatus("Select a client first.");
    return;
  }
  const assignedForms = (elements.intakeAssignedForms.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}/intake-packets`, {
      status: elements.intakeStatus.value,
      assignedForms,
      submittedAt: elements.intakeStatus.value === "completed" || elements.intakeStatus.value === "reviewed" ? (/* @__PURE__ */ new Date()).toISOString() : null
    }, "POST");
    await loadClientContext(clientId, true);
    setManageStatus("Intake packet saved.");
  });
}
async function saveTreatmentPlan() {
  const clientId = elements.chartClientSelect.value;
  if (!clientId) {
    setManageStatus("Select a client first.");
    return;
  }
  const goals = (elements.treatmentPlanGoals.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const interventions = (elements.treatmentPlanInterventions.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}/treatment-plan`, {
      status: elements.treatmentPlanStatus.value,
      goals,
      interventions,
      reviewCadence: "monthly",
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, "PUT");
    await loadClientContext(clientId, true);
    setManageStatus("Treatment plan saved.");
  });
}
async function createProgressNote() {
  const clientId = elements.chartClientSelect.value;
  if (!clientId) {
    setManageStatus("Select a client first.");
    return;
  }
  const summary = elements.progressNoteSummary.value.trim();
  if (!summary) {
    setManageStatus("Enter a progress note summary first.");
    return;
  }
  const interventions = (elements.treatmentPlanInterventions.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  await runMutation(async () => {
    await postJson(`/api/v1/clients/${clientId}/progress-notes`, {
      noteType: elements.progressNoteType.value,
      summary,
      interventions,
      locked: Boolean(elements.progressNoteLocked.checked),
      signedBy: state.activeRole
    }, "POST");
    elements.progressNoteSummary.value = "";
    elements.progressNoteLocked.checked = false;
    await loadClientContext(clientId, true);
    const notesCount = state.clientProgressNotes[clientId]?.length ?? 0;
    setManageStatus(`Progress note created. Total notes: ${notesCount}.`);
  });
}
async function createDocumentTemplate() {
  const title = elements.documentTemplateTitle.value.trim();
  if (!title) {
    setManageStatus("Enter a template title first.");
    return;
  }
  const contentBlocks = (elements.documentTemplateBlocks.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  await runMutation(async () => {
    await postJson("/api/v1/document-templates", {
      title,
      templateType: elements.documentTemplateType.value,
      audience: elements.documentTemplateAudience.value,
      versionNumber: Number(elements.documentTemplateVersion.value || 1),
      contentBlocks
    }, "POST");
    elements.documentTemplateTitle.value = "";
    elements.documentTemplateBlocks.value = "";
    elements.documentTemplateVersion.value = "1";
    setManageStatus("Document template created.");
  });
}
async function assignDocumentTemplate() {
  const clientId = elements.documentsClientSelect.value;
  const templateId = elements.documentTemplateSelect.value;
  if (!clientId || !templateId) {
    setManageStatus("Select a client and template first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/document-assignments", {
      templateId,
      assigneeType: "client",
      assigneeId: clientId,
      status: elements.documentAssignmentStatus.value,
      requiresSignature: Boolean(elements.documentAssignmentRequiresSignature.checked)
    }, "POST");
    const total = state.documentAssignments.filter((item) => item.assigneeType === "client" && item.assigneeId === clientId).length + 1;
    setManageStatus(`Document assignment saved. Client now has ${total} assignments.`);
  });
}
async function createInventoryDefinition() {
  const name = elements.inventoryDefinitionName.value.trim();
  if (!name) {
    setManageStatus("Enter an inventory name first.");
    return;
  }
  const questionSchema = parseInventoryQuestionSchema(elements.inventoryQuestionSchema.value || "");
  await runMutation(async () => {
    await postJson("/api/v1/inventory-definitions", {
      name,
      category: elements.inventoryCategory.value,
      scoringMethod: elements.inventoryScoringMethod.value,
      questionSchema
    }, "POST");
    elements.inventoryDefinitionName.value = "";
    elements.inventoryQuestionSchema.value = "";
    setManageStatus("Inventory definition created.");
  });
}
async function submitInventoryAssignment() {
  const clientId = elements.inventoryClientSelect.value;
  const inventoryId = elements.inventoryDefinitionSelect.value;
  if (!clientId || !inventoryId) {
    setManageStatus("Select a client and inventory first.");
    return;
  }
  const responses = parseInventoryResponses(elements.inventoryResponseEntries.value || "");
  await runMutation(async () => {
    await postJson("/api/v1/inventory-assignments", {
      inventoryId,
      clientId,
      status: elements.inventoryAssignmentStatus.value,
      responses
    }, "POST");
    const total = state.inventoryAssignments.filter((item) => item.clientId === clientId).length + 1;
    setManageStatus(`Inventory assignment saved. Client now has ${total} inventory records.`);
  });
}
async function createServiceCode() {
  const code = elements.billingServiceCode.value.trim();
  const name = elements.billingServiceName.value.trim();
  if (!code || !name) {
    setManageStatus("Enter service code and name first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/billing/service-codes", {
      code,
      name,
      category: elements.billingServiceCategory.value.trim() || "therapy",
      defaultDurationMinutes: Number(elements.billingServiceDuration.value || 60),
      status: "active"
    }, "POST");
    elements.billingServiceCode.value = "";
    elements.billingServiceName.value = "";
    setManageStatus("Service code created.");
  });
}
async function createFeeSchedule() {
  const name = elements.billingFeeScheduleName.value.trim();
  if (!name) {
    setManageStatus("Enter fee schedule name first.");
    return;
  }
  const lines = (elements.billingFeeScheduleLines.value || "").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [serviceCodeId, amountRaw] = line.split("|").map((part) => part?.trim());
    return {
      serviceCodeId,
      amount: Number(amountRaw)
    };
  }).filter((line) => line.serviceCodeId && Number.isFinite(line.amount) && line.amount > 0);
  if (!lines.length) {
    setManageStatus("Add at least one fee schedule line (serviceCodeId|amount).");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/billing/fee-schedules", {
      name,
      currency: elements.billingFeeScheduleCurrency.value.trim() || "USD",
      lines,
      status: "active"
    }, "POST");
    elements.billingFeeScheduleName.value = "";
    elements.billingFeeScheduleLines.value = "";
    setManageStatus("Fee schedule created.");
  });
}
async function createInvoice() {
  const clientId = elements.billingClientSelect.value;
  const serviceCodeId = elements.billingInvoiceServiceCodeSelect.value;
  if (!clientId || !serviceCodeId) {
    setManageStatus("Select a client and service code first.");
    return;
  }
  const serviceCode = state.serviceCodes.find((item) => item.id === serviceCodeId);
  const dueAt = elements.billingInvoiceDueAt.value ? toIsoDate(`${elements.billingInvoiceDueAt.value}T23:59:59`) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString();
  await runMutation(async () => {
    await postJson("/api/v1/billing/invoices", {
      clientId,
      dueAt,
      status: "issued",
      lineItems: [
        {
          serviceCodeId,
          code: serviceCode?.code || "",
          description: serviceCode?.name || "Counseling Session",
          quantity: 1,
          unitAmount: Number(elements.billingInvoiceUnitAmount.value || 150),
          serviceDate: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      insurance: {
        payerName: elements.billingInvoicePayerName.value.trim()
      }
    }, "POST");
    elements.billingInvoicePayerName.value = "";
    setManageStatus("Invoice created.");
  });
}
async function recordPayment() {
  const invoiceId = elements.billingInvoiceSelect.value;
  if (!invoiceId) {
    setManageStatus("Select an invoice first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/billing/payments", {
      invoiceId,
      amount: Number(elements.billingPaymentAmount.value || 0),
      method: elements.billingPaymentMethod.value || "other",
      receivedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, "POST");
    setManageStatus("Payment recorded.");
  });
}
async function createSuperbill() {
  const invoiceId = elements.billingInvoiceSelect.value;
  if (!invoiceId) {
    setManageStatus("Select an invoice first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/billing/superbills", {
      invoiceId,
      diagnosisCodes: ["F41.1"]
    }, "POST");
    setManageStatus("Superbill generated.");
  });
}
async function createClaimPlaceholder() {
  const invoiceId = elements.billingInvoiceSelect.value;
  if (!invoiceId) {
    setManageStatus("Select an invoice first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/billing/claims", {
      invoiceId,
      status: elements.billingClaimStatus.value || "queued",
      notes: "Created from UI claim placeholder workflow."
    }, "POST");
    setManageStatus("Claim placeholder created.");
  });
}
async function refreshAgingReport() {
  const asOf = elements.billingAgingAsOf.value ? toIsoDate(`${elements.billingAgingAsOf.value}T23:59:59`) : (/* @__PURE__ */ new Date()).toISOString();
  try {
    const payload = await fetchJson(`/api/v1/billing/reports/aging?asOf=${encodeURIComponent(asOf)}`);
    state.agingReport = payload.report ?? null;
    renderBillingSummary();
    setManageStatus("Aging report refreshed.");
  } catch (error) {
    setManageStatus(error.message || "Unable to load aging report.");
  }
}
function renderBillingSummary() {
  if (!elements.billingAgingSummary) return;
  const report = state.agingReport;
  if (!report?.totals) {
    elements.billingAgingSummary.value = "No aging report data loaded yet.";
    return;
  }
  const lines = [
    `Outstanding: $${Number(report.totals.outstanding ?? 0).toFixed(2)}`,
    `Current: $${Number(report.totals.current ?? 0).toFixed(2)}`,
    `1-30 Days: $${Number(report.totals.days1to30 ?? 0).toFixed(2)}`,
    `31-60 Days: $${Number(report.totals.days31to60 ?? 0).toFixed(2)}`,
    `61-90 Days: $${Number(report.totals.days61to90 ?? 0).toFixed(2)}`,
    `Over 90 Days: $${Number(report.totals.over90 ?? 0).toFixed(2)}`,
    "",
    "Top Clients:",
    ...(report.clients ?? []).slice(0, 3).map((client) => `${client.clientName}: $${Number(client.outstanding ?? 0).toFixed(2)} (${client.invoiceCount} invoices)`)
  ];
  elements.billingAgingSummary.value = lines.join("\n");
}
function renderPortalSummary() {
  if (!elements.portalOverviewSummary) return;
  if (!state.activePortalClientId) {
    elements.portalOverviewSummary.value = "No portal client selected.";
    return;
  }
  const client = state.clients.find((item) => item.id === state.activePortalClientId);
  const balances = state.portalBalances ?? { outstanding: 0, total: 0, paid: 0, items: [] };
  const lines = [
    `Client: ${client ? `${client.firstName} ${client.lastName}` : state.activePortalClientId}`,
    `Portal Account: ${state.portalAccount?.status ?? "not_created"}`,
    `Forms: ${(state.portalForms ?? []).length}`,
    `Documents: ${(state.portalDocuments ?? []).length}`,
    `Appointment Requests: ${(state.portalAppointmentRequests ?? []).length}`,
    `Message Threads: ${(state.portalMessageThreads ?? []).length}`,
    `Resources: ${(state.portalResources ?? []).length}`,
    "",
    `Balance Total: $${Number(balances.total ?? 0).toFixed(2)}`,
    `Amount Paid: $${Number(balances.paid ?? 0).toFixed(2)}`,
    `Outstanding: $${Number(balances.outstanding ?? 0).toFixed(2)}`
  ];
  if (elements.portalAccountStatus) {
    elements.portalAccountStatus.value = state.portalAccount?.status ?? "invited";
  }
  if (elements.portalAccountEmail) {
    elements.portalAccountEmail.value = state.portalAccount?.email ?? "";
  }
  elements.portalOverviewSummary.value = lines.join("\n");
}
function renderFaithSummary() {
  if (!elements.faithOverviewSummary) return;
  const practice = state.practices.find((item) => item.id === state.activeFaithPracticeId) ?? state.practices[0];
  const preference = state.faithLanguagePreference ?? {};
  const lines = [
    `Practice: ${practice?.name ?? "Not selected"}`,
    `Integration Level: ${preference.integrationLevel ?? "balanced"}`,
    `Explicit Faith Language: ${preference.explicitFaithLanguage !== false ? "Yes" : "No"}`,
    `Prayer Language: ${preference.includePrayerLanguage !== false ? "Included" : "Excluded"}`,
    `Scripture References: ${preference.includeScriptureReferences !== false ? "Included" : "Excluded"}`,
    "",
    `Note Templates: ${state.faithNoteTemplates.length}`,
    `Treatment Goal Templates: ${state.faithTreatmentGoals.length}`,
    `Consent Variants: ${state.faithConsentVariants.length}`,
    `Resource Library Items: ${state.faithResources.length}`,
    `Spiritual Inventories: ${state.faithInventories.length}`,
    `Church Coordination Plans: ${state.faithReferralCoordinations.length}`
  ];
  if (elements.faithPreferredTerminology) {
    elements.faithPreferredTerminology.value = preference.preferredTerminology ?? "";
  }
  if (elements.faithIntegrationLevel) {
    elements.faithIntegrationLevel.value = preference.integrationLevel ?? "balanced";
  }
  if (elements.faithExplicitLanguage) {
    elements.faithExplicitLanguage.checked = preference.explicitFaithLanguage !== false;
  }
  if (elements.faithIncludePrayerLanguage) {
    elements.faithIncludePrayerLanguage.checked = preference.includePrayerLanguage !== false;
  }
  if (elements.faithIncludeScriptureReferences) {
    elements.faithIncludeScriptureReferences.checked = preference.includeScriptureReferences !== false;
  }
  elements.faithOverviewSummary.value = lines.join("\n");
}
function renderReportingOpsSummary() {
  if (elements.reportingSummary) {
    const reporting = state.reportingOverview;
    if (!reporting) {
      elements.reportingSummary.value = "No reporting data loaded yet.";
    } else {
      const lines = [
        `Window: ${reporting.windowDays} days`,
        `Generated: ${formatTime(reporting.generatedAt)}`,
        "",
        `Sessions in Window: ${reporting.utilization?.sessionsInWindow ?? 0}`,
        `Completed Sessions: ${reporting.utilization?.sessionsCompleted ?? 0}`,
        `Remote Completion Rate: ${Number(reporting.utilization?.remoteRate ?? 0).toFixed(1)}%`,
        `Avg Sessions per Counselor: ${Number(reporting.utilization?.avgSessionsPerCounselor ?? 0).toFixed(2)}`,
        "",
        `Top Referral Source: ${reporting.referralSources?.[0]?.referralSource ?? "None"}`,
        `Document Completion: ${Number(reporting.documentCompletion?.completionRate ?? 0).toFixed(1)}%`,
        `Accounts Receivable: $${Number(reporting.accountsReceivable?.totals?.outstanding ?? 0).toFixed(2)}`,
        `Top Location: ${reporting.locationPerformance?.[0]?.locationName ?? "None"}`
      ];
      elements.reportingSummary.value = lines.join("\n");
    }
  }
  if (elements.platformSummary) {
    const platform = state.platformOverview;
    if (!platform) {
      elements.platformSummary.value = "No platform operations data loaded yet.";
      return;
    }
    const lines = [
      `Generated: ${formatTime(platform.generatedAt)}`,
      "",
      `Provisioning Requests: ${platform.provisioning?.total ?? 0}`,
      `Provisioning Queued: ${platform.provisioning?.queued ?? 0}`,
      `Impersonation Active: ${platform.supportImpersonation?.active ?? 0}`,
      `Data Exports Total: ${platform.dataExports?.total ?? 0}`,
      `Data Exports Queued: ${platform.dataExports?.queued ?? 0}`,
      "",
      `Retention Clinical: ${platform.retentionPolicy?.clinicalRecordsSchedule ?? "not_set"}`,
      `Retention Billing: ${platform.retentionPolicy?.billingSchedule ?? "not_set"}`,
      `Retention Audit: ${platform.retentionPolicy?.auditLogSchedule ?? "not_set"}`,
      `Legal Hold: ${platform.retentionPolicy?.legalHoldEnabled ? "Enabled" : "Disabled"}`
    ];
    elements.platformSummary.value = lines.join("\n");
    if (platform.retentionPolicy) {
      if (elements.retentionClinicalRecordsSchedule) {
        elements.retentionClinicalRecordsSchedule.value = platform.retentionPolicy.clinicalRecordsSchedule ?? "10_years";
      }
      if (elements.retentionBillingSchedule) {
        elements.retentionBillingSchedule.value = platform.retentionPolicy.billingSchedule ?? "7_years";
      }
      if (elements.retentionAuditLogSchedule) {
        elements.retentionAuditLogSchedule.value = platform.retentionPolicy.auditLogSchedule ?? "indefinite";
      }
      if (elements.retentionIncludeDocumentVersions) {
        elements.retentionIncludeDocumentVersions.checked = platform.retentionPolicy.includeDocumentVersions !== false;
      }
      if (elements.retentionLegalHoldEnabled) {
        elements.retentionLegalHoldEnabled.checked = Boolean(platform.retentionPolicy.legalHoldEnabled);
      }
    }
  }
}
async function refreshPortalOverviewAction() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  state.activePortalClientId = clientId;
  await refreshPortalOverviewForClient(clientId);
}
async function refreshFaithOverviewAction() {
  const practiceId = elements.faithPracticeSelect.value || state.activeFaithPracticeId;
  if (!practiceId) {
    setManageStatus("Select a practice first.");
    return;
  }
  state.activeFaithPracticeId = practiceId;
  await refreshFaithOverviewForPractice(practiceId);
}
async function refreshReportingOverviewAction() {
  const days = Number(elements.reportingWindowDays?.value || 30);
  const safeDays = Number.isFinite(days) && days >= 7 && days <= 365 ? Math.floor(days) : 30;
  try {
    const payload = await fetchJson(`/api/v1/reporting/overview?days=${encodeURIComponent(safeDays)}`);
    applyReportingOverview(payload);
    renderReportingOpsSummary();
    setManageStatus("Reporting overview refreshed.");
  } catch (error) {
    setManageStatus(error.message || "Unable to load reporting overview.");
  }
}
async function refreshPlatformOverviewAction() {
  try {
    const payload = await fetchJson("/api/v1/platform/overview");
    applyPlatformOverview(payload);
    renderReportingOpsSummary();
    setManageStatus("Platform operations summary refreshed.");
  } catch (error) {
    setManageStatus(error.message || "Unable to load platform operations summary.");
  }
}
async function createTenantProvisioningRequest() {
  const requestedTenantId = elements.platformRequestedTenantId.value.trim();
  const requestedPracticeName = elements.platformRequestedPracticeName.value.trim();
  const ownerEmail = elements.platformOwnerEmail.value.trim();
  if (!requestedTenantId || !requestedPracticeName || !ownerEmail) {
    setManageStatus("Enter tenant ID, practice name, and owner email first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/platform/tenant-provisioning", {
      requestedTenantId,
      requestedPracticeName,
      ownerEmail,
      status: "queued"
    }, "POST");
    elements.platformRequestedPracticeName.value = "";
    elements.platformOwnerEmail.value = "";
    setManageStatus("Tenant provisioning request created.");
  });
}
async function startSupportImpersonationSession() {
  const targetTenantId = elements.impersonationTargetTenantId.value.trim();
  const reason = elements.impersonationReason.value.trim();
  if (!targetTenantId || reason.length < 10) {
    setManageStatus("Enter target tenant and a detailed reason (10+ chars).");
    return;
  }
  await runMutation(async () => {
    const payload = await postJson("/api/v1/platform/impersonation-sessions", {
      targetTenantId,
      targetRole: elements.impersonationTargetRole.value || "practice_admin",
      reason
    }, "POST");
    elements.impersonationReason.value = "";
    elements.endImpersonationSessionId.value = payload.item?.id ?? "";
    setManageStatus("Support impersonation session started with audit trace.");
  });
}
async function endSupportImpersonationSession() {
  const sessionId = elements.endImpersonationSessionId.value.trim();
  if (!sessionId) {
    setManageStatus("Enter an impersonation session ID to end.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/platform/impersonation-sessions", {
      sessionId,
      status: "ended"
    }, "PATCH");
    setManageStatus("Impersonation session ended.");
  });
}
async function requestDataExport() {
  await runMutation(async () => {
    await postJson("/api/v1/platform/data-exports", {
      exportType: elements.exportType.value || "clinical_records",
      format: elements.exportFormat.value || "json",
      status: "queued"
    }, "POST");
    setManageStatus("Data export requested.");
  });
}
async function saveRetentionPolicy() {
  await runMutation(async () => {
    await postJson("/api/v1/platform/retention-policies", {
      clinicalRecordsSchedule: elements.retentionClinicalRecordsSchedule.value || "10_years",
      billingSchedule: elements.retentionBillingSchedule.value || "7_years",
      auditLogSchedule: elements.retentionAuditLogSchedule.value || "indefinite",
      includeDocumentVersions: elements.retentionIncludeDocumentVersions.checked,
      legalHoldEnabled: elements.retentionLegalHoldEnabled.checked
    }, "POST");
    setManageStatus("Retention policy saved.");
  });
}
async function createPortalAccount() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/portal/accounts", {
      clientId,
      status: elements.portalAccountStatus.value || "invited",
      email: elements.portalAccountEmail.value.trim()
    }, "POST");
    state.activePortalClientId = clientId;
    setManageStatus("Portal account created.");
  });
}
async function submitPortalIntakePacket() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  const assignedForms = (elements.portalIntakeForms.value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  await runMutation(async () => {
    await postJson(`/api/v1/portal/intake-packets?clientId=${encodeURIComponent(clientId)}`, {
      status: elements.portalIntakeStatus.value || "in_progress",
      assignedForms
    }, "POST");
    setManageStatus("Portal intake update submitted.");
  });
}
async function signPortalDocument() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  const assignmentId = elements.portalDocumentSelect.value;
  if (!clientId || !assignmentId) {
    setManageStatus("Select a client and portal document first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/portal/documents?clientId=${encodeURIComponent(clientId)}`, {
      assignmentId,
      status: elements.portalDocumentStatus.value || "signed"
    }, "PATCH");
    setManageStatus("Portal document status saved.");
  });
}
async function createPortalAppointmentRequest() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  const preferredStartAt = toIsoDate(elements.portalRequestStart.value);
  const preferredEndAt = toIsoDate(elements.portalRequestEnd.value);
  if (!preferredStartAt || !preferredEndAt) {
    setManageStatus("Select preferred start and end times first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/portal/appointment-requests?clientId=${encodeURIComponent(clientId)}`, {
      preferredStartAt,
      preferredEndAt,
      mode: elements.portalRequestMode.value || "remote",
      notes: elements.portalRequestNotes.value.trim(),
      status: "requested"
    }, "POST");
    elements.portalRequestNotes.value = "";
    setManageStatus("Portal appointment request created.");
  });
}
async function sendPortalMessage() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  const body = elements.portalMessageBody.value.trim();
  if (!body) {
    setManageStatus("Enter a secure message first.");
    return;
  }
  const threadId = elements.portalMessageThreadSelect.value;
  const subject = elements.portalMessageSubject.value.trim();
  await runMutation(async () => {
    await postJson(`/api/v1/portal/messages?clientId=${encodeURIComponent(clientId)}`, {
      threadId: threadId || void 0,
      subject: threadId ? void 0 : subject || "Portal message",
      body
    }, "POST");
    elements.portalMessageBody.value = "";
    if (!threadId) elements.portalMessageSubject.value = "";
    setManageStatus("Secure portal message sent.");
  });
}
async function publishPortalResource() {
  const clientId = elements.portalClientSelect.value || state.activePortalClientId;
  if (!clientId) {
    setManageStatus("Select a portal client first.");
    return;
  }
  const title = elements.portalResourceTitle.value.trim();
  const content = elements.portalResourceContent.value.trim();
  if (!title || !content) {
    setManageStatus("Enter a resource title and content first.");
    return;
  }
  await runMutation(async () => {
    await postJson(`/api/v1/portal/resources?clientId=${encodeURIComponent(clientId)}`, {
      title,
      content,
      resourceType: elements.portalResourceType.value || "education"
    }, "POST");
    elements.portalResourceTitle.value = "";
    elements.portalResourceContent.value = "";
    setManageStatus("Portal resource published.");
  });
}
async function createFaithNoteTemplate() {
  const sections = parseMultilineValues(elements.faithTemplateSections.value);
  const name = elements.faithNoteTemplateName.value.trim();
  if (!name || !sections.length) {
    setManageStatus("Enter a note template name and at least one section.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/note-templates", {
      name,
      focusArea: elements.faithNoteFocusArea.value.trim(),
      integrationLevel: elements.faithIntegrationLevel.value || "balanced",
      sections
    }, "POST");
    elements.faithNoteTemplateName.value = "";
    elements.faithTemplateSections.value = "";
    setManageStatus("Faith note template created.");
  });
}
async function createFaithGoalTemplate() {
  const title = elements.faithGoalTitle.value.trim();
  const milestones = parseMultilineValues(elements.faithGoalMilestones.value);
  if (!title || !milestones.length) {
    setManageStatus("Enter a goal title and at least one milestone.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/treatment-goals", {
      title,
      integrationLevel: elements.faithIntegrationLevel.value || "balanced",
      scriptures: parseMultilineValues(elements.faithGoalScriptures.value),
      milestones
    }, "POST");
    elements.faithGoalTitle.value = "";
    elements.faithGoalScriptures.value = "";
    elements.faithGoalMilestones.value = "";
    setManageStatus("Faith treatment goal template created.");
  });
}
async function createFaithConsentVariant() {
  const title = elements.faithConsentTitle.value.trim();
  const body = elements.faithConsentBody.value.trim();
  if (!title || !body) {
    setManageStatus("Enter consent variant title and language.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/consent-variants", {
      title,
      body,
      audience: elements.faithConsentAudience.value || "client",
      integrationLevel: elements.faithIntegrationLevel.value || "balanced"
    }, "POST");
    elements.faithConsentTitle.value = "";
    elements.faithConsentBody.value = "";
    setManageStatus("Faith consent variant created.");
  });
}
async function createFaithResource() {
  const title = elements.faithResourceTitle.value.trim();
  const content = elements.faithResourceContent.value.trim();
  if (!title || !content) {
    setManageStatus("Enter resource title and content first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/resources", {
      title,
      content,
      scriptureReference: elements.faithResourceScripture.value.trim(),
      resourceType: elements.faithResourceType.value || "devotional"
    }, "POST");
    elements.faithResourceTitle.value = "";
    elements.faithResourceScripture.value = "";
    elements.faithResourceContent.value = "";
    setManageStatus("Faith resource published.");
  });
}
async function createFaithInventory() {
  const name = elements.faithInventoryName.value.trim();
  const prompts = parseMultilineValues(elements.faithInventoryPrompts.value);
  if (!name || !prompts.length) {
    setManageStatus("Enter inventory name and at least one prompt.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/inventories", {
      name,
      cadence: elements.faithInventoryCadence.value || "weekly",
      prompts
    }, "POST");
    elements.faithInventoryName.value = "";
    elements.faithInventoryPrompts.value = "";
    setManageStatus("Spiritual inventory created.");
  });
}
async function createFaithCoordinationPlan() {
  const clientId = elements.faithCoordinationClientSelect.value;
  const churchName = elements.faithCoordinationChurch.value.trim();
  if (!clientId || !churchName) {
    setManageStatus("Select a client and enter church name first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/referral-coordination", {
      clientId,
      churchName,
      status: elements.faithCoordinationStatus.value || "proposed",
      contactName: elements.faithCoordinationContactName.value.trim(),
      contactMethod: elements.faithCoordinationContactMethod.value.trim(),
      consentToCoordinate: elements.faithCoordinationConsent.checked,
      notes: elements.faithCoordinationNotes.value.trim()
    }, "POST");
    elements.faithCoordinationChurch.value = "";
    elements.faithCoordinationContactName.value = "";
    elements.faithCoordinationContactMethod.value = "";
    elements.faithCoordinationNotes.value = "";
    setManageStatus("Church coordination plan created.");
  });
}
async function saveFaithLanguagePreferences() {
  const practiceId = elements.faithPracticeSelect.value || state.activeFaithPracticeId;
  if (!practiceId) {
    setManageStatus("Select a practice first.");
    return;
  }
  await runMutation(async () => {
    await postJson("/api/v1/faith/language-preferences", {
      practiceId,
      integrationLevel: elements.faithIntegrationLevel.value || "balanced",
      preferredTerminology: elements.faithPreferredTerminology.value.trim(),
      explicitFaithLanguage: elements.faithExplicitLanguage.checked,
      includePrayerLanguage: elements.faithIncludePrayerLanguage.checked,
      includeScriptureReferences: elements.faithIncludeScriptureReferences.checked
    }, "POST");
    setManageStatus("Faith language preferences saved.");
  });
}
async function createLocale() {
  clearFieldErrors(["newLocaleCode"]);
  const locale = elements.newLocaleCode.value.trim().toLowerCase();
  if (!locale) {
    setFieldError("newLocaleCode", t2("message.localeRequired"));
    return;
  }
  const payload = await postJson("/api/v1/i18n/locales", {
    locale,
    label: elements.newLocaleLabel.value.trim() || locale.toUpperCase()
  }, "POST");
  state.locales = dedupeLocales([...state.locales, { locale: payload.locale, label: payload.label, completion: payload.completion }]);
  populateLocaleSelect(elements.languageSelect, state.locales, state.locale);
  populateLocaleSelect(elements.translationLocaleSelect, state.locales, locale);
  elements.newLocaleCode.value = "";
  elements.newLocaleLabel.value = "";
  setLanguageStatus(t2("message.localeCreated"));
  await loadTranslationLocale(locale);
}
async function autoTranslateLocale() {
  const locale = elements.translationLocaleSelect.value;
  if (!locale) return;
  setLanguageStatus(t2("message.saving"));
  const payload = await postJson("/api/v1/i18n/translate", {
    locale,
    settings: readTranslationSettingsFromControls()
  }, "POST");
  state.translationCatalog = payload;
  state.translationDraft = { ...payload.messages };
  setLanguageStatus(t2("message.autoTranslated"));
  renderTranslationEditor();
}
async function saveTranslationConfig() {
  clearFieldErrors(["translationGlossary"]);
  const locale = elements.translationLocaleSelect.value;
  if (!locale) return;
  let settings;
  try {
    settings = readTranslationSettingsFromControls();
  } catch {
    setFieldError("translationGlossary", t2("message.invalidGlossary"));
    return;
  }
  const payload = await postJson(`/api/v1/i18n/settings/${encodeURIComponent(locale)}`, {
    settings
  }, "PATCH");
  state.translationSettings = {
    ...state.translationSettings,
    ...payload.settings ?? {}
  };
  setLanguageStatus(t2("message.translationConfigSaved"));
}
async function saveTranslations() {
  const locale = elements.translationLocaleSelect.value;
  if (!locale) return;
  setLanguageStatus(t2("message.saving"));
  const payload = await postJson(`/api/v1/i18n/catalog/${locale}`, { messages: state.translationDraft }, "PATCH");
  state.translationCatalog = payload;
  setLanguageStatus(t2("message.translationsSaved"));
  if (locale === state.locale) {
    await loadCatalog(locale);
    renderAll();
  }
}
function renderTranslationEditor() {
  if (!elements.translationEditor || !state.translationCatalog) return;
  const filter = (elements.translationFilter.value ?? "").toLowerCase().trim();
  const keys = listMessageKeys().filter((key) => !filter || key.toLowerCase().includes(filter) || (baseMessages[key] ?? "").toLowerCase().includes(filter));
  elements.translationEditor.innerHTML = "";
  if (!keys.length) {
    elements.translationEditor.innerHTML = `<div class="empty-state"><h3>${t2("language.empty")}</h3></div>`;
    return;
  }
  keys.forEach((key) => {
    const row = document.createElement("div");
    row.className = "translation-row";
    const input = document.createElement("input");
    input.value = state.translationDraft[key] ?? "";
    input.addEventListener("input", () => {
      state.translationDraft[key] = input.value;
    });
    row.innerHTML = `<strong>${key}</strong><small>${baseMessages[key] ?? ""}</small>`;
    row.appendChild(input);
    elements.translationEditor.appendChild(row);
  });
}
async function refreshTelemetry() {
  setManageStatus(t2("message.refreshingTelemetry"));
  try {
    state.telemetrySummary = await fetchJson("/api/v1/telemetry/summary");
    renderTelemetry();
  } catch {
    setManageStatus(t2("message.telemetryUnavailable"));
  }
}
function renderTelemetry() {
  if (!elements.telemetryGrid) return;
  elements.telemetryGrid.innerHTML = "";
  const summary = state.telemetrySummary?.summary;
  if (!summary) return;
  const cards = [
    { title: t2("telemetry.backend"), detail: `${t2("telemetry.requestLatency")}: avg ${summary.requestLatencyMs.avg} ms \xB7 p95 ${summary.requestLatencyMs.p95} ms` },
    { title: t2("telemetry.frontend"), detail: `${t2("telemetry.lcp")}: ${summary.browserVitals.LCP?.value ?? 0} \xB7 ${t2("telemetry.cls")}: ${summary.browserVitals.CLS?.value ?? 0} \xB7 ${t2("telemetry.inp")}: ${summary.browserVitals.INP?.value ?? 0}` },
    { title: t2("telemetry.infrastructure"), detail: `${t2("telemetry.heapUsage")}: ${summary.process.heapUsedMb} MB \xB7 ${t2("telemetry.uptime")}: ${summary.process.uptimeSeconds}s \xB7 ${t2("telemetry.activeRequests")}: ${summary.activeRequests}` }
  ];
  cards.forEach((card) => {
    const node = document.createElement("div");
    node.className = "telemetry-card";
    node.innerHTML = `<h3>${card.title}</h3><p>${card.detail}</p>`;
    elements.telemetryGrid.appendChild(node);
  });
}
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t2(node.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t2(node.getAttribute("data-i18n-placeholder")));
  });
  document.title = t2("app.name");
  updateUserBadge();
  populateStatusSelect(elements.newClientStatusSelect, ["active", "waitlist", "inactive", "discharged"]);
  populateStatusSelect(elements.clientStatusSelect, ["active", "waitlist", "inactive", "discharged"]);
  populateStatusSelect(elements.appointmentStatusSelect, ["scheduled", "checked_in", "completed", "cancelled", "no_show"]);
  renderTranslationEditor();
}
function updateUserBadge() {
  if (!elements.userBadge) return;
  elements.userBadge.textContent = state.activeRole ? `${t2("header.signedIn")} \xB7 ${prettifyRole(state.activeRole)}` : t2("header.notSignedIn");
}
function renderPalette() {
  if (!elements.paletteList) return;
  const query = (elements.paletteInput.value ?? "").toLowerCase().trim();
  const activeRole = state.activeRole || "platform_admin";
  const allowedNavItems = new Set(accessMatrix[activeRole] ?? ["dashboard"]);
  const commands = [
    { label: t2("header.quickActions"), execute: () => elements.globalSearch?.focus() },
    { label: t2("manage.tab.appointments"), execute: () => setActiveTab("appointments"), navKey: "scheduling" },
    { label: "Billing", execute: () => setActiveTab("billing"), navKey: "billing" },
    { label: "Portal", execute: () => setActiveTab("portal"), navKey: "portal" },
    { label: "Reporting & Ops", execute: () => setActiveTab("reporting"), navKey: "reporting" },
    { label: "Faith Workflows", execute: () => setActiveTab("faith"), navKey: "faith" },
    { label: t2("manage.tab.language"), execute: () => setActiveTab("language"), navKey: "reporting" },
    { label: t2("header.signOut"), execute: signOut }
  ].filter((command) => !command.navKey || allowedNavItems.has(command.navKey)).filter((command) => command.label.toLowerCase().includes(query));
  elements.paletteList.innerHTML = "";
  if (!commands.length) {
    elements.paletteList.innerHTML = `<li class="empty-state"><h3>${t2("state.noResults")}</h3><p>${t2("state.tryBroader")}</p></li>`;
    return;
  }
  commands.forEach((command) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = command.label;
    button.addEventListener("click", () => {
      command.execute();
      closePalette();
    });
    li.appendChild(button);
    elements.paletteList.appendChild(li);
  });
}
function openPalette() {
  elements.commandPalette.classList.add("visible");
  elements.commandPalette.setAttribute("aria-hidden", "false");
  renderPalette();
  elements.paletteInput.focus();
}
function closePalette() {
  elements.commandPalette.classList.remove("visible");
  elements.commandPalette.setAttribute("aria-hidden", "true");
  elements.openPaletteButton?.focus();
}
function setActiveTab(tabName) {
  const visibleTabNames = new Set(getVisibleTabButtons().map((button) => button.getAttribute("data-tab")));
  if (!visibleTabNames.has(tabName)) return;
  state.activeTab = tabName;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const active = button.getAttribute("data-tab") === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const active = panel.getAttribute("data-panel") === tabName;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
    if (active) panel.setAttribute("tabindex", "-1");
  });
  syncPrimaryNavigation();
}
function applySession(role) {
  state.activeRole = role;
  applyAccessControl(role);
  setSignedInState(true, role);
}
function applyAccessControl(role) {
  const allowed = accessMatrix[role] ?? ["dashboard"];
  document.querySelectorAll("[data-nav-key]").forEach((button) => {
    const canSee = allowed.includes(button.getAttribute("data-nav-key"));
    button.hidden = !canSee;
    button.tabIndex = canSee ? 0 : -1;
  });
  applyTabAccessControl(role);
  ensureVisibleActiveTab(role);
  syncPrimaryNavigation();
}
function setSignedInState(isSignedIn, role) {
  elements.authGate.classList.toggle("visible", !isSignedIn);
  if (isSignedIn) {
    elements.authGate.setAttribute("hidden", "hidden");
    state.activeRole = role;
  } else {
    elements.authGate.removeAttribute("hidden");
    state.activeRole = "";
  }
  updateUserBadge();
}
function signOut() {
  localStorage.removeItem(sessionStorageKey);
  applyAccessControl("platform_admin");
  setSignedInState(false, "");
}
function buildRoleSelect(roles) {
  elements.roleSelect.innerHTML = "";
  [...new Set(roles)].forEach((role) => {
    const option = document.createElement("option");
    option.value = role;
    option.textContent = prettifyRole(role);
    elements.roleSelect.appendChild(option);
  });
}
function populateLocaleSelect(select, locales, selectedLocale) {
  if (!select) return;
  select.innerHTML = "";
  locales.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.locale;
    option.textContent = `${item.label} (${item.locale})`;
    select.appendChild(option);
  });
  if (selectedLocale) select.value = selectedLocale;
}
async function runMutation(action) {
  try {
    setManageStatus(t2("message.saving"));
    toggleMutationButtons(true);
    await telemetry.withSpan("ui.mutation", action);
    await refreshDashboardData();
    await refreshTelemetry();
  } catch (error) {
    setManageStatus(error.message || "Request failed");
  } finally {
    toggleMutationButtons(false);
  }
}
function toggleMutationButtons(isDisabled) {
  [
    elements.createClientButton,
    elements.updateClientButton,
    elements.updateAppointmentButton,
    elements.cancelAppointmentButton,
    elements.deleteAppointmentButton,
    elements.createAppointmentButton,
    elements.createPracticeButton,
    elements.updatePracticeButton,
    elements.createLocationButton,
    elements.updateLocationButton,
    elements.deleteLocationButton,
    elements.createStaffButton,
    elements.updateStaffButton,
    elements.saveStaffAvailabilityButton,
    elements.saveLifecycleButton,
    elements.createConsentButton,
    elements.saveIntakePacketButton,
    elements.saveTreatmentPlanButton,
    elements.createProgressNoteButton,
    elements.createDocumentTemplateButton,
    elements.assignDocumentTemplateButton,
    elements.createInventoryDefinitionButton,
    elements.submitInventoryAssignmentButton,
    elements.createServiceCodeButton,
    elements.createFeeScheduleButton,
    elements.createInvoiceButton,
    elements.recordPaymentButton,
    elements.createSuperbillButton,
    elements.createClaimButton,
    elements.refreshAgingReportButton,
    elements.createPortalAccountButton,
    elements.refreshPortalOverviewButton,
    elements.submitPortalIntakeButton,
    elements.signPortalDocumentButton,
    elements.createPortalRequestButton,
    elements.sendPortalMessageButton,
    elements.publishPortalResourceButton,
    elements.refreshFaithOverviewButton,
    elements.createFaithTemplateButton,
    elements.createFaithGoalButton,
    elements.createFaithConsentVariantButton,
    elements.createFaithResourceButton,
    elements.createFaithInventoryButton,
    elements.createFaithCoordinationButton,
    elements.saveFaithLanguagePreferencesButton,
    elements.refreshReportingOverviewButton,
    elements.refreshPlatformOverviewButton,
    elements.createTenantProvisioningButton,
    elements.startImpersonationButton,
    elements.endImpersonationButton,
    elements.requestDataExportButton,
    elements.saveRetentionPolicyButton
  ].forEach((button) => {
    if (button) button.disabled = isDisabled;
  });
}
function parseMultilineValues(raw) {
  return (raw ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}
function parseInventoryQuestionSchema(raw) {
  return raw.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [key, prompt, minRaw, maxRaw] = line.split("|").map((part) => part?.trim());
    return {
      key,
      prompt,
      min: Number.isFinite(Number(minRaw)) ? Number(minRaw) : 0,
      max: Number.isFinite(Number(maxRaw)) ? Number(maxRaw) : 3
    };
  }).filter((entry) => entry.key && entry.prompt);
}
function parseInventoryResponses(raw) {
  return raw.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [key, valueRaw] = line.split("|").map((part) => part?.trim());
    return {
      key,
      value: Number(valueRaw)
    };
  }).filter((entry) => entry.key && Number.isFinite(entry.value));
}
async function reportVital(vital) {
  try {
    await fetch("/api/v1/telemetry/vitals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(vital),
      keepalive: true
    });
  } catch {
  }
}
function t2(key, values) {
  return formatMessage(state.messages, key, values);
}
function setManageStatus(message) {
  setStatusMessage(elements.manageStatus, message, /unable|failed|required|invalid|degraded/i.test(message) ? "error" : "success");
}
function setLanguageStatus(message) {
  setStatusMessage(elements.languageStatus, message, /invalid|unable|failed/i.test(message) ? "error" : "info");
}
function applyTranslationSettingsToControls() {
  const settings = state.translationSettings;
  if (elements.translationSourceLocale) elements.translationSourceLocale.value = settings.sourceLocale ?? "en";
  if (elements.translationTone) elements.translationTone.value = settings.tone ?? "neutral";
  if (elements.translationFallbackMode) elements.translationFallbackMode.value = settings.fallbackMode ?? "prefixed";
  if (elements.translationUseGlossary) elements.translationUseGlossary.checked = settings.useGlossary !== false;
  if (elements.translationGlossary) {
    elements.translationGlossary.value = Object.entries(settings.glossary ?? {}).map(([source, target]) => `${source}=${target}`).join("\n");
  }
}
function readTranslationSettingsFromControls() {
  const glossary = parseGlossary(elements.translationGlossary?.value ?? "");
  return {
    sourceLocale: (elements.translationSourceLocale?.value ?? "en").trim() || "en",
    tone: elements.translationTone?.value ?? "neutral",
    fallbackMode: elements.translationFallbackMode?.value ?? "prefixed",
    useGlossary: Boolean(elements.translationUseGlossary?.checked),
    glossary
  };
}
function parseGlossary(raw) {
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.reduce((result, line) => {
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      throw new Error("invalid glossary");
    }
    const source = line.slice(0, equalsIndex).trim();
    const target = line.slice(equalsIndex + 1).trim();
    if (!source || !target) {
      throw new Error("invalid glossary");
    }
    result[source] = target;
    return result;
  }, {});
}
function setFieldError(fieldId, message) {
  const target = document.getElementById(`${fieldId}Error`);
  const field = document.getElementById(fieldId);
  if (target) target.textContent = message;
  if (field) {
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (target && message) {
      field.setAttribute("aria-describedby", target.id);
    } else {
      field.removeAttribute("aria-describedby");
    }
  }
}
function clearFieldErrors(fieldIds) {
  fieldIds.forEach((fieldId) => setFieldError(fieldId, ""));
}
function readSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionStorageKey) ?? "{}");
  } catch {
    return {};
  }
}
async function fetchJson(url, options = {}) {
  return telemetry.withSpan(`fetch:${url}`, async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...requestHeaders(),
        ...options.headers || {}
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(buildApiErrorMessage(payload, response.status));
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  });
}
async function postJson(url, body, method) {
  return fetchJson(url, {
    method,
    headers: { ...requestHeaders(), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
function requestHeaders() {
  const role = state.activeRole || "platform_admin";
  const portalClientId = state.activePortalClientId || elements.portalClientSelect?.value || "";
  const headers = {
    "x-staff-role": role,
    "x-tenant-id": "system",
    "x-actor-id": `ui-${role}`,
    "x-request-id": `ui-${Date.now()}`
  };
  if (role === "client" && portalClientId) {
    headers["x-client-id"] = portalClientId;
  }
  return headers;
}
function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}
function buildApiErrorMessage(payload, status) {
  const base = payload?.error || "Request failed";
  if (status === 409 && Array.isArray(payload?.conflicts) && payload.conflicts.length) {
    const detail = payload.conflicts.map((conflict) => conflict.message).filter(Boolean).slice(0, 2).join(" \xB7 ");
    return detail ? `${base}: ${detail}` : base;
  }
  return base;
}
function prettifyRole(role) {
  return role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function toIsoDate(localDateValue) {
  if (!localDateValue) return null;
  const parsed = new Date(localDateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function dedupeLocales(locales) {
  const seen = /* @__PURE__ */ new Map();
  locales.forEach((locale) => {
    seen.set(locale.locale, locale);
  });
  return [...seen.values()];
}
function isTypingElement(element) {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || element.isContentEditable;
}
function applyTabAccessControl(role) {
  const allowedTabs = new Set(tabAccessMatrix[role] ?? []);
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const tabName = button.getAttribute("data-tab");
    const canSee = allowedTabs.has(tabName);
    button.hidden = !canSee;
    button.tabIndex = canSee && tabName === state.activeTab ? 0 : -1;
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const tabName = panel.getAttribute("data-panel");
    if (!allowedTabs.has(tabName)) {
      panel.hidden = true;
      panel.classList.remove("active");
    }
  });
}
function ensureVisibleActiveTab(role) {
  const allowedTabs = tabAccessMatrix[role] ?? [];
  if (allowedTabs.includes(state.activeTab)) return;
  if (!allowedTabs.length) return;
  state.activeTab = allowedTabs[0];
  setActiveTab(state.activeTab);
}
function getVisibleTabButtons() {
  return [...document.querySelectorAll("[data-tab]")].filter((button) => !button.hidden);
}
function syncPrimaryNavigation(forcedNavKey) {
  const activeNavKey = forcedNavKey || tabToNavMap[state.activeTab] || "dashboard";
  document.querySelectorAll("[data-nav-key]").forEach((button) => {
    const isActive = button.getAttribute("data-nav-key") === activeNavKey;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}
function setConnectionStatus(message, tone = "loading") {
  if (!elements.dataConnection) return;
  elements.dataConnection.textContent = message;
  elements.dataConnection.dataset.state = tone;
}
function setStatusMessage(element, message, tone = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}
function debounce(callback, waitMs) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), waitMs);
  };
}
