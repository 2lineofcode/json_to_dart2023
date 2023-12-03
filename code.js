/// mapping part importance to maintenance, search 1 of kind bellow
// - initial jsonTestCase
// - field keyword prefix
// - init variable from checkbox
// - checkbox default value
// - Display error information
// - null safe in arraylist
// - When value is null will replace with default value
// - fix empty object
// - filename suggestion
// - fromJson handle array
// - toJson handle array
// - handle dimensional array
// - linesOutput (dart code output)

$(function () {
	//initialization
	(function init() {

		showInfo = (info) => $('.info').show().html(info);

		hideInfo = () => $('.info').hide();

		const jsonEditorCachekey = 'jsonEditor';

		let resultDartCode = '';

		/// * initial jsonTestCase
		let jsonTestCase = {
			"message": "hello there!, paste your complex JSON here",
			"last_update": 2023.12
		};

		/// * create the editor
		const container = document.getElementById("origJsonContainer")
		const options = {
			"mode": "code",
			onChangeText: (str) => {
				$.cookie(jsonEditorCachekey, str);
				generate();
			},
		}
		
		let editor;

		try { editor = new JSONEditor(container, options) }
		catch { showInfo('Load JSONEditor faild, please try reload'); }

		function tab(count) {
			return '  '.repeat(count + 1);
		}

		function generate() {

			let isForceToString = $('#isForceToStringCheckbox').prop('checked');
			let isShouldEnhanceFaultTolerance = $('#isFaultToleranceCheckBox').prop('checked');

			hideInfo();
			let jsonObj;

			try {
				jsonObj = editor.get();
			} catch (error) {
				$('#dartCode').html(error.toString());
				return;
			}

			// Snake to camel
			const snakeToCamel = (str) => str.replace(/([-_][a-zA-Z])/g, (group) => group.charAt(1).toUpperCase());

			// Remove duplicate elements
			const removeSurplusElement = (obj) => {
				if (Array.isArray(obj)) {
					obj.length = 1;
					removeSurplusElement(obj[0]);
				} else if (typeof obj === 'object') {
					for (let key in obj) {
						if (obj.hasOwnProperty(key)) {
							removeSurplusElement(obj[key]);
						}
					}
				}
			};
			
			// Uppercase conversion
			const uppercaseFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);


			/// TODO: field keyword prefix
			let dartKeywordDefence = key => {
				if (typeof key === 'string') {
					//https://dart.dev/guides/language/language-tour
					let reservedKeywords = [
						"num", "double", "int", "String", "bool", "List", "abstract", "dynamic", "implements", "show", "as", "else", "import", "static", "assert", "enum", "in", "super", "async", "export",
						"interface", "switch", "await", "extends", "is", "sync", "break", "external", "library", "this", "case", "factory", "mixin", "throw", "catch", "false", "new", "true", "class", "final",
						"null", "try", "const", "finally", "on", "typedef", "continue", "for", "operator", "var", "covariant", "Function", "part", "void", "default", "get", "rethrow", "while", "deferred", "hide", "return",
						"with", "do", "if", "set", "yield"
					];

					/// first index is number
					let isStartWithNum = key.match(/^\d/);
					if (reservedKeywords.includes(key) || isStartWithNum) {
						return `x${uppercaseFirst(key)}`;
					}

					/// first index is symbol
					let isStartWithSymbol = key.match(/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/);
					if (reservedKeywords.includes(key) || isStartWithSymbol) {
						return `x${uppercaseFirst(key.substring(1).replaceAll(/[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/g, ''))}`;
					}

					/// first index is _
					if (key.startsWith('_')) {
						return `x${uppercaseFirst(key)}`;
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

			/// Generic string generator
			let genericStringGenerator = (innerClass, count) => {
				let genericStrings = [innerClass];
				while (count) {
					genericStrings.unshift('List<');
					genericStrings.push('>');
					count--;
				}
				let genericString = genericStrings.join('');
				return genericString;
			}

			// !Get the innermost object, type and layer number
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
				}

				let inner = getInnerObj(arr);
				let innerClass = className;

				/// * isforceToString? 
				/// * if true => replace to String, except boolean and object
				if (typeof inner === 'object') {
					// don't handle object
				} else if (typeof inner === 'boolean') {
					// don't handle boolean
					innerClass = 'bool';
				} 
				else {
					if (typeof inner === 'string') {
						innerClass = 'String';
					}
					if (typeof inner === 'number') {
						if (Number.isInteger(inner)) {
							innerClass = 'num';
						} else {
							innerClass = 'num';
						}
					}
					if (isForceToString) {
						innerClass = 'String';
					}
				}
				return { inner, innerClass, count };
			};

			// ! Get the array cycle sentence
			let getIterateLines = (arr, className, key, legalKey, jsonKey, shouldNullSafe) => {
				if (legalKey == 'data') legalKey = 'this.data';

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
				if (typeof inner === 'object') {
					if (count > 0) {
						let fprefix = ``;

						if (count > 1) {
							fprefix += `${tab(1)}/// ! your structure demension depth > 2, maybe need cast manual. if still error after casting, copy this part and fix it in OpenAI \n`;
						}
						fprefix += `${tab(1)}${legalKey} = (json[${jsonKey}] == null ? null : (json[${jsonKey}] as List).map((e) => e == null ? [] : (e as List).map((e) => ${innerClass}.fromJson(e)).toList()).toList())?.cast<List<${innerClass}>>();\n`;
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
					let toType = 'v';
					if (typeof inner === 'boolean') {
						//we don't handle boolean
					} else {
						if (isForceToString) inner = inner.toString();
						if (typeof inner === 'string') toType = 'v.toString()';
						if (typeof inner === 'number') {
							if (Number.isInteger(inner)) {
								toType = isShouldEnhanceFaultTolerance ? 'int.tryParse(v.toString() ?? \'\')' : 'v.toInt()';
							} else {
								toType = isShouldEnhanceFaultTolerance ? 'double.tryParse(v.toString() ?? \'\')' : 'v.toDouble()';
							}
						}
					}

					/// * handle dimensional array [primitif] => ✅
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						if (count > 0) {
							let fprefix = ``;
							fprefix += `${tab(1)}${legalKey} = json[${jsonKey}] == null ? null : ${genericStringGenerator(innerClass, total)}.from(json[${jsonKey}]);\n`;
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
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						if (isShouldEnhanceFaultTolerance) {
							fromJsonLines.push(`${tab(1)}if (json[${jsonKey}] is List) {\n${tab(2)}${legalKey} = json[${jsonKey}] == null ? null : List${genericStringGenerator(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n${tab(1)}}\n`);
						} else {
							fromJsonLines.push(`${tab(1)}${legalKey} = json[${jsonKey}] == null ? null : List${genericStringGenerator(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n`);
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
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						toJsonLines.push(`${tab(1)}if (${legalKey} != null) {\n${tab(2)}data[${jsonKey}] = ${legalKey};\n${tab(1)}}\n`);
					}

					// ? array object
					else {
						toJsonLines.push(`${tab(1)}if (${legalKey} != null) {\n${tab(2)}data[${jsonKey}] = ${legalKey}?.map((e) => e.toJson()).toList();\n${tab(1)}}\n`);
					}

				}
				
				let fromJsonLinesJoined = fromJsonLines.join('\r\n');
				let toJsonLinesJoined = toJsonLines.join('\r\n');
				return { fromJsonLinesJoined, toJsonLinesJoined };
			};

			// !json object to dart
			let objToDart = (jsonObj, prefix, baseClass) => {
				if (Array.isArray(jsonObj)) {
					return objToDart(jsonObj[0], prefix, baseClass);
				}

				let lines = [];
				let jsonKeysLines = [];
				let propsLines = [];
				let constructorLines = [];
				let fromJsonLines = [];
				let toJsonLines = [];
				let fromListLines = [];
				let copyWithLines = [];
				let toStringLines = [];

				/// TODO: init variable from checkbox
				let shouldNullSafe = true;
				let isShouldEnhanceFaultTolerance = $('#isFaultToleranceCheckBox').prop('checked');
				let isRemoveFromJson = $('#isRemoveFromJsonCheckBox').prop('checked');
				let isRemoveToJson = $('#isRemoveToJsonCheckBox').prop('checked');
				let isRemoveConstructors = $('#isRemoveConstructorsCheckBox').prop('checked');
				let isWithDefaultValue = $('#isWithDefaultValueCheckBox').prop('checked');
				let isIncludeCopyWith = $('#isIncludeCopyWithCheckBox').prop('checked');
				let isIncludeFromList = $('#isIncludeFromListCheckBox').prop('checked');
				let isIncludeToString = $('#isIncludeToStringCheckBox').prop('checked');

				/// -----------------------------------------------------------------

				let className = `${prefix}${uppercaseFirst(baseClass)}`;

				className = snakeToCamel(className);

				lines.push(`class ${className} {`);
				
				constructorLines.push(`  ${className}({`);
				fromJsonLines.push(`  ${className}.fromJson(Map<String, dynamic> json) {\n`);
				toJsonLines.push(`  Map<String, dynamic> toJson() {\n`);
				toJsonLines.push(`    final data = <String, dynamic>{};\n`);

				for (let key in jsonObj) {

					if (jsonObj.hasOwnProperty(key)) {
						let element = jsonObj[key];
						let legalKey = dartKeywordDefence(key);

						legalKey = snakeToCamel(legalKey);

						let thisData = '';
						if (key == 'data') thisData = 'this.';

						let jsonKey = `'${key}'`;

						jsonKeysLines.push(`const String ${jsonKey} = '${key}';`);
						constructorLines.push(`this.${legalKey}, `);


						if (element === null) {
							//!Display warning information
							showInfo(` 🐞 MESSAGE: the Property named &nbsp<b>'${key}'</b>&nbsp is NULL, which will be treated as dynamic`);
							element = 'dynamic';
						}

						if (typeof element === 'object') {
							let subClassName = `${className}${uppercaseFirst(key)}`;

							subClassName = snakeToCamel(subClassName);

							if (Array.isArray(element)) {
								let { inner, innerClass, count } = getInnerObjInfo(element, subClassName);
								let { fromJsonLinesJoined, toJsonLinesJoined } = getIterateLines(element, subClassName, key, legalKey, jsonKey, shouldNullSafe);

								let genericString = genericStringGenerator(innerClass, count);

								/// TODO: null safe in arraylist
								if (shouldNullSafe) {
									genericString = genericString.replaceAll('>', '>') + '?';
								}

								// if array is empty change to type dynamic
								if (element[0] != null) {
									propsLines.push(`  ${genericString} ${legalKey};\n`);
								} else {
									propsLines.push(`  List<dynamic>? ${legalKey};\n`);
								}

								fromJsonLines.push(fromJsonLinesJoined);
								toJsonLines.push(toJsonLinesJoined);

								if (typeof inner === 'object') {
									lines.unshift(objToDart(element, className, key));
								}

							} else {
								lines.unshift(objToDart(element, className, key));
								propsLines.push(`  ${subClassName}${shouldNullSafe ? '?' : ''} ${legalKey};\n`);
								let typeCheck = isShouldEnhanceFaultTolerance ? ` && (json[${jsonKey}] is Map)` : '';
								fromJsonLines.push(`    ${legalKey} = (json[${jsonKey}] != null${typeCheck}) ? ${subClassName}.fromJson(json[${jsonKey}]) : null;\n`);
								toJsonLines.push(`    if (${thisData}${legalKey} != null) {\n      data[${jsonKey}] = ${thisData}${legalKey}${shouldNullSafe ? '!' : ''}.toJson();\n    }\n`);
							}
						}

						else {
							/// TODO: When value is null will replace with default value
							let toType = `json[${jsonKey}]`;
							let type = '';
							if (typeof element === 'boolean') {
								if (isWithDefaultValue) toType = `json[${jsonKey}] ?? false`;
								type = 'bool';
							} else {
								if (isForceToString) element = element.toString();

								if (element == 'dynamic') {
									toType = isWithDefaultValue ? `json[${jsonKey}] ?? ''` : `json[${jsonKey}]`;
									if (isForceToString) type = 'String';
									else type = 'dynamic';
								}

								else if (typeof element === 'string') {
									toType = isWithDefaultValue ? `json[${jsonKey}] ?? ''` : `json[${jsonKey}]`;
									type = 'String';
								}

								else if (typeof element === 'number') {
									if (Number.isInteger(element)) {
										toType = isShouldEnhanceFaultTolerance
											? `int.tryParse(json[${jsonKey}] ?? '')`
											: isWithDefaultValue
												? `json[${jsonKey}] ?? 0`
												: `json[${jsonKey}]`;
										type = 'num';
									}
									else {
										toType = isShouldEnhanceFaultTolerance
											? `double.tryParse(json[${jsonKey}]?.toString() ?? '')`
											: isWithDefaultValue
												? `json[${jsonKey}] ?? 0.0`
												: `json[${jsonKey}]`;
										type = 'num';
									}
								}
							}
							
							if (type == 'dynamic') {
								propsLines.push(`  ${type} ${legalKey};\n`);
							} else {
								propsLines.push(`  ${type}${shouldNullSafe ? '?' : ''} ${legalKey};\n`);
							}

							fromJsonLines.push(`    ${legalKey} = ${toType};\n`);
							toJsonLines.push(`    data[${jsonKey}] = ${thisData}${legalKey};\n`);
						}
					}
				}

				constructorLines.push(`});\n`);
				fromJsonLines.push(`  }\n`);
				toJsonLines.push(`    return data;\n  }`);


				/// TODO: fix empty object
				if (constructorLines.length < 3) {
					constructorLines = [];
					constructorLines.push(`  ${className}();\n`);
				} else if (constructorLines.length < 20) {
					let suffix = constructorLines.at(constructorLines.length-2).replaceAll(', ','');
					constructorLines.pop();
					constructorLines.pop();
					constructorLines.push(suffix);
					constructorLines.push(`});\n`);
				}

				lines.push(propsLines.join(''));

				// * isRemoveConstructors?
				if (isRemoveConstructors) constructorLines = [];
				lines.push(constructorLines.join(''));
				
				// * isRemoveFromJson?
				if (isRemoveFromJson) fromJsonLines = [];
				lines.push(fromJsonLines.join(''));
				
				// * isRemoveToJson?
				if (isRemoveToJson) toJsonLines = [];
				lines.push(toJsonLines.join(''));

				// * isIncludeFromList?
				fromListLines.push(`\n  static List<${className}> fromList(List<Map<String, dynamic>> list) {\n${tab(1)}return list.map((map) => ${className}.fromJson(map)).toList();\n  }`);
				if (isIncludeFromList) lines.push(fromListLines.join(''));
				
				lines.push(`}\n`);

				/// * reorder linesOutput (dart code output)
				let safeLine = 6; 
				let linesPrefix;
				let linesSuffix;
				let linesFixed;

				if (isIncludeFromList) safeLine++

				linesPrefix = lines.slice(-safeLine);
				linesSuffix = lines.slice(0, -safeLine).reverse();
				linesFixed = [...linesPrefix, ...linesSuffix];
				let linesOutput = linesFixed.join('\r\n');
				return linesOutput;
			};

			removeSurplusElement(jsonObj);

			let rootClass = $('#classNameTextField').val() ?? 'MyModel';

			let prefixDartCode = ``;

			let isShowJSONSource = $('#isShowJSONSourceCheckBox').prop('checked');
			if(isShowJSONSource) {
				prefixDartCode += `/// * \n`;
				prefixDartCode += `/// * JSON Source: ${JSON.stringify(jsonObj)}\n`;
				prefixDartCode += `/// * Code generated: https://aditgpt.github.io/json_to_dart2023\n`;
				prefixDartCode += `/// * \n`;
			}
			prefixDartCode += `${objToDart(jsonObj, rootClass.length > 0 ? rootClass : 'MyModel', "")}`;
			let dartCode = prefixDartCode;

			resultDartCode = dartCode;
			let highlightDartCode = hljs.highlight('dart', dartCode);
			$('#dartCode').html(highlightDartCode.value);

			/// * filename suggestion 
			$('#fileNameTextField').val(rootClass.length > 0 ? rootClass.replace(/([A-Z])/g, "_$1").toLowerCase().substr(1) + '_entity.dart' : '');
		}

		function textFieldBinding(tfID, defaultValue) {
			let selector = '#' + tfID;
			let strFromCookie = $.cookie(tfID);
			if ((strFromCookie === undefined || strFromCookie.length === 0) && defaultValue) {
				$.cookie(tfID, defaultValue);
			}
			$(selector).val($.cookie(tfID));
			$(selector).on('input', function (e) {
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
			let defaultValue = checked ? '1' : '0';
			let selector = '#' + checkBoxID;
			let strFromCookie = $.cookie(checkBoxID);
			if (strFromCookie === undefined || strFromCookie.length === 0) {
				$.cookie(checkBoxID, defaultValue);
			}
			checked = $.cookie(checkBoxID) === '1';
			$(selector).prop('checked', checked);
			$(selector).on('change', function () {
				let checked = $(this).prop('checked') ? '1' : '0';
				$.cookie(checkBoxID, checked);
				generate();
			});
		}

		/// * checkbox default value
		textFieldBinding('classNameTextField', 'MyModel');
		checkBoxBinding('nullSafeCheckBox', true);
		checkBoxBinding('isFaultToleranceCheckBox', false);
		checkBoxBinding('isForceToStringCheckbox', false);
		checkBoxBinding('isRemoveFromJsonCheckBox', false);
		checkBoxBinding('isRemoveToJsonCheckBox', false);
		checkBoxBinding('isRemoveConstructorsCheckBox', false);

		checkBoxBinding('isWithDefaultValueCheckBox', true);
		checkBoxBinding('isShowJSONSourceCheckBox', false);
		checkBoxBinding('isIncludeCopyWithCheckBox', false);
		checkBoxBinding('isIncludeFromListCheckBox', false);
		checkBoxBinding('isIncludeToStringCheckBox', false);

		generate();

		function copyToClipboard(text) {
			var $temp = $("<textarea>");
			$("body").append($temp);
			$temp.val(text).select();
			document.execCommand("copy");
			$temp.remove();
		}

		$('#copyFileBtn').click(function () {
			copyToClipboard(resultDartCode);
		});
	})();

	/// end of file
});