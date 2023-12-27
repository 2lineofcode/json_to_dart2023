/// mapping importance part to maintenance, search 1 of kind bellow
// - initial jsonTestCase
// - field keyword prefix
// - init variable from checkbox
// - checkbox default value
// - Display error information
// - null safe in arraylist
// - When value is null will replace with default value
// - fix empty object
// - filename suggestion
// - loop start begin
// - part push fromJson, toJson, copyWith
// - fromJson handle array
// - toJson handle array
// - handle dimensional array
// - linesOutput (dart code output)
$(document).ready(function () {
  //initialization
  (function init() {
    showInfo = (info) => $(".info").show().html(info);
    hideInfo = () => $(".info").hide();

    const jsonEditorCachekey = "jsonEditor";

    /// * initial jsonTestCase
    const jsonTestCase = {
      data: {
        message: "hello there!, paste your complex JSON here",
        last_update: 2023.12,
      },
    };

    /// * create the editor
    const isDarkMode = document.body.classList.contains("dark-mode");
    const container = document.getElementById("jsoneditor");
    const options = {
      mode: "code",
      theme: isDarkMode ? "ace/theme/pastel_on_dark" : '',
      onChangeText: (str) => {
        $.cookie(jsonEditorCachekey, str);
        generate();
      },
    };

    let fileNameSuggestion = "";
    let resultDartCode = "";
    let editor = new JSONEditor(container, options);
    window.jsonEditor = editor;
    

    function tab(count) {
      return "  ".repeat(count + 1);
    }

    function generate() {
      let isForceToString = $("#isForceToStringCheckbox").prop("checked");
      let isShouldEnhanceFaultTolerance = $("#isFaultToleranceCheckBox").prop("checked");

      hideInfo();
      let jsonObj;

      try {
        jsonObj = editor.get();
      } catch (error) {
        $("#dartCode").html(error.toString());
        return;
      }

      // Snake to camel
      const snakeToCamel = (str) => str.replace(/([-_][a-zA-Z])/g, (group) => group.charAt(1).toUpperCase());

      // Remove duplicate elements
      const removeSurplusElement = (obj) => {
        if (Array.isArray(obj)) {
          obj.length = 1;
          removeSurplusElement(obj[0]);
        } else if (typeof obj === "object") {
          for (let key in obj) {
            if (obj.hasOwnProperty(key)) removeSurplusElement(obj[key]);
          }
        }
      };

      // Uppercase conversion
      const uppercaseFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);

      /// * field keyword prefix
      let dartKeywordDefence = (key) => {
        if (typeof key === "string") {
          //https://dart.dev/guides/language/language-tour
          // prettier-ignore
          let reservedKeywords = [
              "num", "double", "int", "String", "bool", "List", "abstract", "dynamic", "implements", "show", "as", 
              "else", "import", "static", "assert", "enum", "in", "super", "async", "export", "interface", "switch",
              "await", "extends", "is", "sync", "break", "external", "library", "this", "case", "factory", "mixin", 
              "throw", "catch", "false", "new", "true", "class", "final", "null", "try", "const", "finally", "on", 
              "typedef", "continue", "for", "operator", "var", "covariant", "Function", "part", "void",
              "default", "get", "rethrow", "while", "deferred", "hide", "return", "with", "do", "if", "set", "yield",
            ];

          /// first index is number
          let isStartWithNum = key.match(/^\d/);
          if (isStartWithNum) {
            return `x${key}`;
          }

          /// reservedKeywords
          if (reservedKeywords.includes(key)) {
            return `x${uppercaseFirst(key)}`;
          }

          /// first index is symbol
          if (/^[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/.test(key)) {
            return `${uppercaseFirst(key).replaceAll(/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/g, "")}`;
          }

          /// first index is `_`
          if (key.charAt(0) === "_") {
            return key.replaceAll("_", "");
          }

          /// all word is capital
          if (key === key.toUpperCase()) {
            const fix = key.toLowerCase();
            return `${fix}`;
          }

          /// first index is capital
          if (key.charAt(0) === key.charAt(0).toUpperCase()) {
            const pre = key.substring(0, 1).toLowerCase();
            const fix = key.substring(1);
            return `${pre}${fix}`;
          }
        }
        return key;
      };

      // ! Generic string generator
      let generateGenericString = (innerClass, count) => {
        let genericStrings = [innerClass];
        while (count) {
          genericStrings.unshift("List<");
          genericStrings.push(">");
          count--;
        }
        let genericString = genericStrings.join("");
        return genericString;
      };

      // ! Get the innermost object, type and layer number
      let getInnerObjInfo = (arr, className) => {
        let count = 0;

        let getInnerObj = (arr) => {
          if (Array.isArray(arr)) {
            let first = arr[0];
            count++;
            return getInnerObj(first);
          } else {
            return arr;
          }
        };

        let inner = getInnerObj(arr);
        let innerClass = className;

        /// * isforceToString?
        /// * if true => replace to String, except boolean and object
        if (typeof inner === "object") {
          // don't handle object
        } else if (typeof inner === "boolean") {
          // don't handle boolean
          innerClass = "bool";
        } else {
          if (typeof inner === "string") {
            innerClass = "String";
          }
          if (typeof inner === "number") {
            let isUseNum = $("#isUseNumCheckbox").prop("checked");
            if (Number.isInteger(inner)) {
              innerClass = isUseNum ? "num" : "int";
            } else {
              innerClass = isUseNum ? "num" : "double";
            }
          }
          if (isForceToString) {
            innerClass = "String";
          }
        }
        return { inner, innerClass, count };
      };

      // ! Get the array cycle sentence
      let getIterateLines = (arr, className, key, legalKey, jsonKey, shouldNullSafe) => {
        if (legalKey == "data") legalKey = "this.data";

        let { inner, innerClass, count } = getInnerObjInfo(arr, className);

        if (inner === undefined || inner === null) {
          showInfo(` 🐞 WARNING : the property named &nbsp <b> '${key}' </b> &nbsp is an EMPTY array! which will treated as List(dynamic)`);
          return {
            fromJsonLinesJoined: `${tab(1)}${legalKey} = json[${jsonKey}] ?? [];\n`,
            toJsonLinesJoined: `${tab(1)}if (${legalKey} != null) {\n${tab(2)}data['${legalKey}'] = ${legalKey};\n${tab(1)}}\n`,
          };
        }

        let total = count;
        let fromJsonLines = [];
        let toJsonLines = [];

        count--;

        /// * handle dimensional array [object] => ✅
        if (typeof inner === "object") {
          if (count > 0) {
            let fprefix = ``;

            if (count > 1) {
              fprefix += `${tab(1)}/// ! your structure demension depth > 2, maybe need cast manual. if still error after casting, copy this part and fix it in OpenAI \n`;
            }
            fprefix += `${tab(1)}${legalKey} = (json[${jsonKey}] == null ? null : (json[${jsonKey}] as List)`;
            fprefix += `.map((e) => e == null ? [] : (e as List).map((e) => ${innerClass}.fromJson(e)).toList()).toList())?.cast<List<${innerClass}>>();\n`;
            fromJsonLines.push(fprefix);

            let tprefix = ``;
            tprefix += `${tab(1)}if (${legalKey} != null) {\n`;
            if (count > 1) {
              tprefix += `${tab(2)}/// ! your structure demension depth > 2, maybe need cast manual. if still error after casting, copy this part and fix it in OpenAI \n`;
            }
            tprefix += `${tab(2)}data[${jsonKey}] = ${legalKey}?.map((e) => e.map((e) => e.toJson()).toList()).toList();\n`;
            tprefix += `${tab(1)}}\n`;
            toJsonLines.push(`${tprefix}`);
          }
        } else {
          let toType = "v";
          if (typeof inner === "boolean") {
            //we don't handle boolean
          } else {
            if (isForceToString) inner = inner.toString();
            if (typeof inner === "string") toType = "v.toString()";
            if (typeof inner === "number") {
              if (Number.isInteger(inner)) {
                toType = isShouldEnhanceFaultTolerance ? "int.tryParse(v.toString() ?? '')" : "v.toInt()";
              } else {
                toType = isShouldEnhanceFaultTolerance ? "double.tryParse(v.toString() ?? '')" : "v.toDouble()";
              }
            }
          }

          /// * handle dimensional array [primitif] => ✅
          if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") {
            if (count > 0) {
              let fprefix = ``;
              fprefix += `${tab(1)}${legalKey} = json[${jsonKey}] == null ? null : ${generateGenericString(innerClass, total)}.from(json[${jsonKey}]);\n`;
              fromJsonLines.push(fprefix);

              let tPrefix = ``;
              tPrefix += `${tab(1)}if (${legalKey} != null) {\n`;
              tPrefix += `${tab(2)}data[${jsonKey}] = ${legalKey};\n`;
              tPrefix += `${tab(1)}}\n`;
              toJsonLines.push(`${tPrefix}`);
            }
          }
        }

        /// * handle dimensional array [base]
        if (count > 0) {
          while (count) {
            count--;
          }
        } else {
          /// * fromJson handle array
          // ? array primitif
          if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") {
            if (isShouldEnhanceFaultTolerance) {
              fromJsonLines.push(`${tab(1)}if (json[${jsonKey}] is List) {\n${tab(2)}${legalKey} = json[${jsonKey}] == null ? null : List${generateGenericString(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n${tab(1)}}\n`);
            } else {
              fromJsonLines.push(`${tab(1)}${legalKey} = json[${jsonKey}] == null ? null : List${generateGenericString(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n`);
            }
          }
          // ? array object
          else {
            if (isShouldEnhanceFaultTolerance) {
              fromJsonLines.push(`${tab(1)}if (json[${jsonKey}] is List) {\n${tab(2)}${legalKey} = json[${jsonKey}] == null ? null : (json[${jsonKey}] as List).map((e) => ${className}.fromJson(e)).toList();\n${tab(1)}}\n`);
            } else {
              fromJsonLines.push(`${tab(1)}${legalKey} = json[${jsonKey}] == null ? null : (json[${jsonKey}] as List).map((e) => ${className}.fromJson(e)).toList();\n`);
            }
          }

          /// * toJson handle array
          // ? array primitif
          if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") {
            toJsonLines.push(`${tab(1)}if (${legalKey} != null) {\n${tab(2)}data[${jsonKey}] = ${legalKey};\n${tab(1)}}\n`);
          }

          // ? array object
          else {
            toJsonLines.push(`${tab(1)}if (${legalKey} != null) {\n${tab(2)}data[${jsonKey}] = ${legalKey}?.map((e) => e.toJson()).toList();\n${tab(1)}}\n`);
          }
        }

        let fromJsonLinesJoined = fromJsonLines.join("\r\n");
        let toJsonLinesJoined = toJsonLines.join("\r\n");
        return { fromJsonLinesJoined, toJsonLinesJoined };
      };

      // !json object to dart
      let objToDart = (jsonObj, prefix, baseClass) => {
        if (Array.isArray(jsonObj)) {
          return objToDart(jsonObj[0], prefix, baseClass);
        }

        let lines = [];
        let propsLines = [];
        let constructorLines = [];
        let fromJsonLines = [];
        let toJsonLines = [];
        let fromListLines = [];
        let copyWithLines = [];
        let toStringLines = [];

        /// * init variable from checkbox
        let shouldNullSafe = true;
        let isShouldEnhanceFaultTolerance = $("#isFaultToleranceCheckBox").prop("checked");
        let isUseNum = $("#isUseNumCheckbox").prop("checked");
        let isRemoveFromJson = $("#isRemoveFromJsonCheckBox").prop("checked");
        let isRemoveToJson = $("#isRemoveToJsonCheckBox").prop("checked");
        let isRemoveConstructors = $("#isRemoveConstructorsCheckBox").prop("checked");
        let isWithDefaultValue = $("#isWithDefaultValueCheckBox").prop("checked");
        let isIncludeFromList = $("#isIncludeFromListCheckBox").prop("checked");
        let isIncludeCopyWith = $("#isIncludeCopyWithCheckBox").prop("checked");
        let isIncludeToString = $("#isIncludeToStringCheckBox").prop("checked");

        /// -----------------------------------------------------------------

        let className = `${prefix}${uppercaseFirst(baseClass)}`;
        className = snakeToCamel(className);

        lines.push(`class ${className} {`);

        constructorLines.push(`  ${className}({`);
        fromJsonLines.push(`  ${className}.fromJson(Map<String, dynamic> json) {\n`);
        toJsonLines.push(`  Map<String, dynamic> toJson() {\n`);
        toJsonLines.push(`    final data = <String, dynamic>{};\n`);
        copyWithLines.push(`\n  ${className} copyWith({\n`);

        /// * loop start begin
        for (let key in jsonObj) {
          if (jsonObj.hasOwnProperty(key)) {
            let element = jsonObj[key];
            let legalKey = dartKeywordDefence(key);
            legalKey = snakeToCamel(legalKey);
            let jsonKey = `'${key}'`;
            let thisData = "";
            if (key == "data") thisData = "this.";

            constructorLines.push(`this.${legalKey}, `);

            if (element === null) {
              //!Display warning information
              showInfo(` 🐞 MESSAGE: the Property named &nbsp<b>'${key}'</b>&nbsp is NULL, which will be treated as dynamic`);
              element = "dynamic";
            }

            const nullSafeSymbol = shouldNullSafe && element != "dynamic" ? "?" : "";

            if (typeof element === "object") {
              let subClassName = `${className}${uppercaseFirst(key)}`;
              subClassName = snakeToCamel(subClassName);

              if (Array.isArray(element)) {
                let { inner, innerClass, count } = getInnerObjInfo(element, subClassName);
                let { fromJsonLinesJoined, toJsonLinesJoined } = getIterateLines(element, subClassName, key, legalKey, jsonKey, shouldNullSafe);

                let genericString = generateGenericString(innerClass, count);

                /// null safe in arraylist
                if (shouldNullSafe) {
                  genericString = genericString.replaceAll(">", ">") + nullSafeSymbol;
                }

                propsLines.push(`  ${element[0] != null ? genericString : `List<dynamic>${nullSafeSymbol}`} ${legalKey};\n`);

                /// * part push fromJson, toJson, copyWith (array)
                fromJsonLines.push(fromJsonLinesJoined);
                toJsonLines.push(toJsonLinesJoined);
                copyWithLines.push(`    ${element[0] != null ? genericString : `List<dynamic>${nullSafeSymbol}`} ${legalKey},\n`);

                if (typeof inner === "object") {
                  lines.unshift(objToDart(element, className, key));
                }
              } else {
                lines.unshift(objToDart(element, className, key));
                propsLines.push(`  ${subClassName}${nullSafeSymbol} ${legalKey};\n`);
                let typeCheck = isShouldEnhanceFaultTolerance ? ` && (json[${jsonKey}] is Map)` : "";

                /// * part push fromJson, toJson, copyWith (object)
                fromJsonLines.push(`    ${legalKey} = (json[${jsonKey}] != null${typeCheck}) ? ${subClassName}.fromJson(json[${jsonKey}]) : null;\n`);
                toJsonLines.push(`    if (${thisData}${legalKey} != null) {\n      data[${jsonKey}] = ${thisData}${legalKey}${shouldNullSafe ? "!" : ""}.toJson();\n    }\n`);
                copyWithLines.push(`    ${subClassName}${nullSafeSymbol} ${legalKey},\n`);
              }
            } else {
              /// * When value is null will replace with default value
              let toType = `json[${jsonKey}]`;
              let type = "";

              if (typeof element === "boolean") {
                if (isWithDefaultValue) toType = `json[${jsonKey}] ?? false`;
                type = "bool";
              } else {
                if (isForceToString) element = element.toString();

                if (element == "dynamic") {
                  toType = isWithDefaultValue ? `json[${jsonKey}] ?? ''` : `json[${jsonKey}]`;
                  type = isForceToString ? "String" : "dynamic";
                } else if (typeof element === "string") {
                  toType = isWithDefaultValue ? `json[${jsonKey}] ?? ''` : `json[${jsonKey}]`;
                  type = "String";
                } else if (typeof element === "number") {
                  if (Number.isInteger(element)) {
                    toType = isShouldEnhanceFaultTolerance ? `int.tryParse(json[${jsonKey}] ?? '')` : isWithDefaultValue ? `json[${jsonKey}] ?? 0` : `json[${jsonKey}]`;
                    type = isUseNum ? "num" : "int";
                  } else {
                    toType = isShouldEnhanceFaultTolerance ? `double.tryParse(json[${jsonKey}]?.toString() ?? '')` : isWithDefaultValue ? `json[${jsonKey}] ?? 0.0` : `json[${jsonKey}]`;
                    type = isUseNum ? "num" : "double";
                  }
                }
              }

              if (type == "dynamic") {
                propsLines.push(`  ${type} ${legalKey};\n`);
              } else {
                propsLines.push(`  ${type}${nullSafeSymbol} ${legalKey};\n`);
              }

              /// * part push fromJson, toJson, copyWith (primitif)
              fromJsonLines.push(`    ${legalKey} = ${toType};\n`);
              toJsonLines.push(`    data[${jsonKey}] = ${thisData}${legalKey};\n`);
              copyWithLines.push(`${tab(1)}${type}${nullSafeSymbol} ${legalKey},\n`);
            }
          }
        }

        /// * part push fromJson, toJson, copyWith (end)
        constructorLines.push(`});\n`);
        fromJsonLines.push(`  }\n`);
        toJsonLines.push(`    return data;\n  }`);
        fromListLines.push(`\n  static List<${className}> fromList(List<Map<String, dynamic>> list) {\n${tab(1)}return list.map((map) => ${className}.fromJson(map)).toList();\n  }`);
        copyWithLines.push(`  }) => ${className}(\n`);
        for (let key in jsonObj) {
          let legalKey = dartKeywordDefence(key);
          legalKey = snakeToCamel(legalKey);
          copyWithLines.push(`    ${legalKey}: ${legalKey} ?? this.${legalKey},\n`);
        }
        copyWithLines.push(`  );\n`);
        toStringLines.push(`\n  @override\n  String toString() {\n    return jsonEncode(this);\n  }`);

        /// * fix empty object
        if (constructorLines.length < 3) {
          constructorLines = [];
          constructorLines.push(`  ${className}();\n`);
          copyWithLines = [];
        } else if (constructorLines.length < 20) {
          let suffix = constructorLines.at(constructorLines.length - 2).replaceAll(", ", "");
          constructorLines.pop();
          constructorLines.pop();
          constructorLines.push(suffix);
          constructorLines.push(`});\n`);
        }

        // * propsLines
        lines.push(propsLines.join(""));

        // * isRemoveConstructors?
        if (!isRemoveConstructors) lines.push(constructorLines.join(""));

        // * isRemoveFromJson?
        if (!isRemoveFromJson) lines.push(fromJsonLines.join(""));

        // * isRemoveToJson?
        if (!isRemoveToJson) lines.push(toJsonLines.join(""));

        // * isIncludeFromList?
        if (isIncludeFromList) lines.push(fromListLines.join(""));

        // * isIncludeCopyWith?
        if (isIncludeCopyWith) lines.push(copyWithLines.join(""));

        // * isIncludeToString?
        if (isIncludeToString) lines.push(toStringLines.join(""));

        lines.push(`}\n`);
        console.log("lines", lines.length);

        /// * reorder linesOutput (dart code output)
        let safeLine = 6;
        let linesPrefix;
        let linesSuffix;
        let linesFixed;

        if (isRemoveConstructors) safeLine--;
        if (isRemoveFromJson) safeLine--;
        if (isRemoveToJson) safeLine--;
        if (isIncludeFromList) safeLine++;
        if (isIncludeCopyWith) safeLine++;
        if (isIncludeToString) safeLine++;

        linesPrefix = lines.slice(-safeLine);
        linesSuffix = lines.slice(0, -safeLine).reverse();
        linesFixed = [...linesPrefix, ...linesSuffix];
        let linesOutput = linesFixed.join("\r\n");
        return linesOutput;
      };

      removeSurplusElement(jsonObj);

      let rootClass = $("#classNameTextField").val() ?? "MyModel";

      let prefixDartCode = ``;

      let isShowJSONSource = $("#isShowJSONSourceCheckBox").prop("checked");

      /// * isIncludeToString?
      let isIncludeToString = $("#isIncludeToStringCheckBox").prop("checked");
      if (isIncludeToString) prefixDartCode += `import 'dart:convert';\n\n`;

      /// * isShowJSONSource?
      if (isShowJSONSource) {
        prefixDartCode += `/// * \n`;
        prefixDartCode += `/// * JSON Source: ${JSON.stringify(jsonObj)}\n`;
        prefixDartCode += `/// * Code generated: https://2lineofcode.github.io/json_to_dart2023\n`;
        prefixDartCode += `/// * \n`;
      }

      prefixDartCode += `${objToDart(jsonObj, rootClass.length > 0 ? rootClass : "MyModel", "")}`;
      let dartCode = prefixDartCode;

      resultDartCode = dartCode;
      let highlightDartCode = hljs.highlight("dart", dartCode);
      $("#dartCode").html(highlightDartCode.value);

      /// * filename suggestion
      $("#fileNameTextField").val(
        rootClass.length > 0
          ? rootClass
              .replace(/([A-Z])/g, "_$1")
              .toLowerCase()
              .substr(1) + "_entity.dart"
          : ""
      );
      
      fileNameSuggestion =
        rootClass
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .substr(1) + "_entity.dart";
    }

    function textFieldBinding(tfID, defaultValue) {
      let selector = "#" + tfID;
      let strFromCookie = $.cookie(tfID);
      if ((strFromCookie === undefined || strFromCookie.length === 0) && defaultValue) {
        $.cookie(tfID, defaultValue);
      }
      $(selector).val($.cookie(tfID));
      $(selector).on("input", function (e) {
        let text = $(this).val();
        $.cookie(tfID, text);
        generate();
      });
    }

    function jsonEditorBinding() {
      let str = $.cookie(jsonEditorCachekey);
      if (str && str.length) {
        editor.setText(str);
      } else {
        editor.set(jsonTestCase);
      }
    }

    jsonEditorBinding();

    function checkBoxBinding(checkBoxID, checked) {
      let defaultValue = checked ? "1" : "0";
      let selector = "#" + checkBoxID;
      let strFromCookie = $.cookie(checkBoxID);
      if (strFromCookie === undefined || strFromCookie.length === 0) {
        $.cookie(checkBoxID, defaultValue);
      }
      checked = $.cookie(checkBoxID) === "1";
      $(selector).prop("checked", checked);
      $(selector).on("change", function () {
        let checked = $(this).prop("checked") ? "1" : "0";
        $.cookie(checkBoxID, checked);
        generate();
      });
    }

    /// * checkbox default value
    textFieldBinding("classNameTextField", "MyModel");
    checkBoxBinding("nullSafeCheckBox", true);
    checkBoxBinding("isFaultToleranceCheckBox", false);
    checkBoxBinding("isUseNumCheckbox", true);
    checkBoxBinding("isForceToStringCheckbox", false);
    checkBoxBinding("isRemoveFromJsonCheckBox", false);
    checkBoxBinding("isRemoveToJsonCheckBox", false);
    checkBoxBinding("isRemoveConstructorsCheckBox", false);

    checkBoxBinding("isWithDefaultValueCheckBox", true);
    checkBoxBinding("isShowJSONSourceCheckBox", false);
    checkBoxBinding("isIncludeCopyWithCheckBox", false);
    checkBoxBinding("isIncludeFromListCheckBox", false);
    checkBoxBinding("isIncludeToStringCheckBox", true);

    generate();

    function copyToClipboard(text) {
      var $temp = $("<textarea>");
      $("body").append($temp);
      $temp.val(text).select();
      document.execCommand("copy");
      $temp.remove();
    }

    $("#copyFileBtn").click(function () {
      copyToClipboard(resultDartCode);
    });

    $("#copyFileNameBtn").click(function () {
      copyToClipboard(fileNameSuggestion);
    });
  })();
});
