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

		function showInfo(info) {
			$('.info').show().html(info);
		}

		function hideInfo() {
			$('.info').hide();
		}
		const jsonEditorCachekey = 'jsonEditor';

		let resultDartCode = '';

		/// TODO: initial jsonTestCase
		let jsonTestCase = {
			"good_field": "json complex case",
			"camelField": 1e0,
			"TitleCase": 123,
			"1yStartFromDigit": false,
			"nul_field": null,
			"void": "im support for DART protectedKey",
			"object_field": { "depth1": { "depth2": { "msg": "dooor" } } },
			"array_field": [{ "name": "abdul", "is_recomnd": null }],
			"dimensional_array": [[{ "ai_model": 3.5, "maxtrix1": -0.121 }]]
		};

		// create the editor
		const container = document.getElementById("origJsonContainer")
		const options = {
			"mode": "code",
			onChangeText: (str) => {
				$.cookie(jsonEditorCachekey, str);
				generate();
			},
		}
		let editor;
		try {
			editor = new JSONEditor(container, options)
		} catch {
			showInfo('Load JSONEditor faild, please try reload');
		}

		// function tryParseJSON(jsonString) {
		// 	try {
		// 		var o = JSON.parse(jsonString);
		// 		if (o && typeof o === "object") {
		// 			return o;
		// 		}
		// 	} catch (e) { }
		// 	return false;
		// }

		function generate() {
			hideInfo();
			let jsonObj;
			try {
				jsonObj = editor.get();
			} catch (error) {
				$('#dartCode').html(error.toString());
				return;
			}

			let forceStringCheckBox = $('#forceStringCheckBox').prop('checked');
			let shouldEnhanceFaultTolerance = $('#faultToleranceCheckBox').prop('checked');

			// snake to camel
			const snakeToCamel = (str) => str.replace(
				/([-_][a-zA-Z])/g,
				(group) => group.toUpperCase()
					.replace('-', '')
					.replace('_', '')
			);

			// Remove duplicate elements
			let removeSurplusElement = (obj) => {
				if (Array.isArray(obj)) {
					obj.length = 1;
					removeSurplusElement(obj[0]);
				} else if (typeof obj === 'object') {
					for (let key in obj) {
						if (obj.hasOwnProperty(key)) {
							removeSurplusElement(obj[key])
						}
					}
				}
			};

			// Uppercase conversion
			let uppercaseFirst = (string) => {
				return string.charAt(0).toUpperCase() + string.slice(1);
			};

			/// TODO: field keyword prefix
			let dartKeywordDefence = key => {
				if (typeof key === 'string') {
					//https://dart.dev/guides/language/language-tour
					let reservedKeywords = ["num", "double", "int", "String", "bool", "List", "abstract", "dynamic", "implements", "show", "as", "else", "import", "static", "assert", "enum", "in", "super", "async", "export", "interface", "switch", "await", "extends", "is", "sync", "break", "external", "library", "this", "case", "factory", "mixin", "throw", "catch", "false", "new", "true", "class", "final", "null", "try", "const", "finally", "on", "typedef", "continue", "for", "operator", "var", "covariant", "Function", "part", "void", "default", "get", "rethrow", "while", "deferred", "hide", "return", "with", "do", "if", "set", "yield"];
					
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

			// Generic string generator
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
				if (typeof inner === 'object') { } else if (typeof inner === 'boolean') {
					// don't handle boolean
					innerClass = 'bool';
				} else {
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
					if (forceStringCheckBox) {
						innerClass = 'String';
					}
				}
				return { inner, innerClass, count };
			};

			// !Get the array cycle sentence
			let getIterateLines = (arr, className, key, legalKey, jsonKey, shouldNullSafe) => {
				if (legalKey == 'data') legalKey = 'this.data';
				function makeBlank(count) {
					let str = '';
					for (let index = 0; index < count + 1; index++) {
						str += '  ';
					}
					return str;
				};

				let { inner, innerClass, count } = getInnerObjInfo(arr, className);

				if (inner === undefined || inner === null) {
					showInfo(` 🐞 WARNING : the property named &nbsp <b> '${key}' </b> &nbsp is an EMPTY array ! parse process is failed !`);
					let jk = jsonKey.replaceAll('\'', '');
					return {
						fromJsonLinesJoined: `${makeBlank(1)}${jk} = json[${jsonKey}] ?? []; // \! <- \`${jk}\` is an EMPTY arraylist\n`,
						toJsonLinesJoined: `${makeBlank(1)}if (${jk} != null) {\n${makeBlank(2)}data['${jk}'] = ${jk}; // \! <- \`${jk}\` is an EMPTY arraylist \n${makeBlank(1)}}\n`,
					};
				}

				let total = count;
				let fromJsonLines = [];
				let toJsonLines = [];

				count--;

				/// * handle dimensional array [object]
				if (typeof inner === 'object') {
					if (count > 0) {
						fromJsonLines.push(`${makeBlank(count * 3)}v.forEach((v) {\n${makeBlank(count * 4)}arr${count}.add(${className}.fromJson(v));\n${makeBlank(count * 3)}});`);
						toJsonLines.push(`${makeBlank(count * 3)}v${shouldNullSafe ? '' : ''}.forEach((v) {\n${makeBlank(count * 4)}arr${count}.add(v${shouldNullSafe ? '' : ''}.toJson());\n${makeBlank(count * 3)}});`);
					}
				} else {
					let toType = 'v';
					if (typeof inner === 'boolean') {
						//we don't handle boolean
					} else {
						if (forceStringCheckBox) inner = inner.toString();
						if (typeof inner === 'string') toType = 'v.toString()';
						if (typeof inner === 'number') {
							if (Number.isInteger(inner)) {
								toType = shouldEnhanceFaultTolerance ? 'int.tryParse(v.toString() ?? \'\')' : 'v.toInt()';
							} else {
								toType = shouldEnhanceFaultTolerance ? 'double.tryParse(v.toString() ?? \'\')' : 'v.toDouble()';
							}
						}
					}

					/// * handle dimensional array [primitif]
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						if (count > 0) {
							fromJsonLines.push(`${makeBlank(count * 3)}v.forEach((v) {\n${makeBlank(count * 4)}arr${count}.add(${toType});\n${makeBlank(count * 3)}});`);
							toJsonLines.push(`${makeBlank(count * 3)}v${shouldNullSafe ? '' : ''}.forEach((v) {\n${makeBlank(count * 4)}arr${count}.add(v);\n${makeBlank(count * 3)}});`);
						}
					}
				}

				/// --------
				/// * handle dimensional array [base]
				/// --------
				if (count > 0) {
					while (count) {
						fromJsonLines.unshift(`${makeBlank(count * 2)}v.forEach((v) {\n${makeBlank(count * 3)}final arr${count} = ${genericStringGenerator(innerClass, total - count).slice(4)}[];`);
						fromJsonLines.push(`${makeBlank(count * 3)}arr${count - 1}.add(arr${count});\n${makeBlank(count * 2)}});`);
						toJsonLines.unshift(`${makeBlank(count * 2)}v${shouldNullSafe ? '' : ''}.forEach((v) {\n${makeBlank(count * 3)}final arr${count} = [];`);
						toJsonLines.push(`${makeBlank(count * 3)}arr${count - 1}.add(arr${count});\n${makeBlank(count * 2)}});`);
						count--;
					}

					let typeCheck = shouldEnhanceFaultTolerance ? ` && (json[${jsonKey}] is List)` : '';
					fromJsonLines.unshift(`${makeBlank(1)}if (json[${jsonKey}] != null${typeCheck}) {\n${makeBlank(2)}final v = json[${jsonKey}];\n${makeBlank(2)}final arr0 = ${genericStringGenerator(innerClass, total).slice(4)}[];`);
					fromJsonLines.push(`${makeBlank(2)}${legalKey} = arr0;\n    }\n`);
					toJsonLines.unshift(`    if (${legalKey} != null) {\n      final v = ${legalKey}!;\n      final arr0 = [];`);
					toJsonLines.push(`      data[${jsonKey}] = arr0;\n    }\n`);

				} else {
					/// --------
					/// * fromJson handle array
					/// --------
					// ? array primitif
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						if (shouldEnhanceFaultTolerance) {
							fromJsonLines.push(`${makeBlank(1)}if (json[${jsonKey}] is List) {\n${makeBlank(2)}${legalKey} = json[${jsonKey}] == null ? null : List${genericStringGenerator(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n${makeBlank(1)}}\n`);
						} else {
							fromJsonLines.push(`${makeBlank(1)}${legalKey} = json[${jsonKey}] == null ? null : List${genericStringGenerator(innerClass, total - count).slice(4)}.from(json[${jsonKey}]);\n`);
						}
					}
					// ? array object
					else {
						if (shouldEnhanceFaultTolerance) {
							fromJsonLines.push(`${makeBlank(1)}if (json[${jsonKey}] is List) {\n${makeBlank(2)}${legalKey} = json[${jsonKey}] == null ? null : (json[${jsonKey}] as List).map((e) => ${className}.fromJson(e)).toList();\n${makeBlank(1)}}\n`);
						} else {
							fromJsonLines.push(`${makeBlank(1)}${legalKey} = json[${jsonKey}] == null ? null : (json[${jsonKey}] as List).map((e) => ${className}.fromJson(e)).toList();\n`);
						}
					}

					/// --------
					/// * toJson handle array
					/// --------
					// ? array primitif
					if ((typeof inner === 'string') || (typeof inner === 'number') || (typeof inner === 'boolean')) {
						toJsonLines.push(`${makeBlank(1)}if (${legalKey} != null) {\n${makeBlank(2)}data[${jsonKey}] = ${legalKey};\n${makeBlank(1)}}\n`);
					} 
					
					// ? array object
					else {
						toJsonLines.push(`${makeBlank(1)}if (${legalKey} != null) {\n${makeBlank(2)}data[${jsonKey}] = ${legalKey}?.map((e) => e.toJson()).toList();\n${makeBlank(1)}}\n`);
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

				/// TODO: init variable from checkbox
				let shouldNullSafe = true;
				let shouldConvertSnakeToCamel = true
				let shouldOridJson = false;
				let shouldUsingJsonKey = $('#usingJsonKeyCheckBox').prop('checked');
				let isJsonKeyPrivate = $('#jsonKeyPrivateCheckBox').prop('checked');
				let shouldEnhanceFaultTolerance = $('#faultToleranceCheckBox').prop('checked');
				// additional
				let removeFromJson = $('#removeFromJson').prop('checked');
				let removeToJson = $('#removeToJson').prop('checked');
				let removeConstructors = $('#removeConstructors').prop('checked');
				let isWithDefaultValue = $('#isWithDefaultValue').prop('checked');

				/// -----------------------------------------------------------------

				let className = `${prefix}${uppercaseFirst(baseClass)}`;

				if (shouldConvertSnakeToCamel) className = snakeToCamel(className);

				lines.push(`class ${className} {`);
				
				constructorLines.push(`  ${className}({`);
				fromJsonLines.push(`  ${className}.fromJson(Map<String, dynamic> json) {\n`);
				
				if (shouldOridJson) fromJsonLines.push(`    __origJson = json;\n`);
				
				toJsonLines.push(`  Map<String, dynamic> toJson() {\n`);
				toJsonLines.push(`    final data = <String, dynamic>{};\n`);

				for (let key in jsonObj) {

					if (jsonObj.hasOwnProperty(key)) {
						let element = jsonObj[key];
						let legalKey = dartKeywordDefence(key);

						if (shouldConvertSnakeToCamel) legalKey = snakeToCamel(legalKey);

						let thisData = '';
						if (key == 'data') thisData = 'this.';

						let jsonKey = `'${key}'`;

						if (shouldUsingJsonKey) {
							jsonKey = `${isJsonKeyPrivate ? '_' : ''}jsonKey${className}${uppercaseFirst(legalKey)}`;
						}

						jsonKeysLines.push(`const String ${jsonKey} = '${key}';`);
						constructorLines.push(`this.${legalKey}, `);


						if (element === null) {
							//!Display warning information
							showInfo(` 🐞 MESSAGE: the Property named &nbsp<b>'${key}'</b>&nbsp is NULL, which will be treated as String type`);
							element = '';
						}

						if (typeof element === 'object') {
							let subClassName = `${className}${uppercaseFirst(key)}`;
							
							if (shouldConvertSnakeToCamel) {
								subClassName = snakeToCamel(subClassName);
							}
							
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
								let typeCheck = shouldEnhanceFaultTolerance ? ` && (json[${jsonKey}] is Map)` : '';
								fromJsonLines.push(`    ${legalKey} = (json[${jsonKey}] != null${typeCheck}) ? ${subClassName}.fromJson(json[${jsonKey}]) : null;\n`);
								toJsonLines.push(`    if (${thisData}${legalKey} != null) {\n      data[${jsonKey}] = ${thisData}${legalKey}${shouldNullSafe ? '!' : ''}.toJson();\n    }\n`);
							}
						} else {
							/// TODO: When value is null will replace with default value
							let toType = `json[${jsonKey}]`;
							let type = '';
							if (typeof element === 'boolean') {
								if (isWithDefaultValue) {
									toType = `json[${jsonKey}] ?? false`;
								}
								type = 'bool';
							} else {
								if (forceStringCheckBox) element = element.toString();

								if (typeof element === 'string') {
									toType = isWithDefaultValue
										? `json[${jsonKey}] ?? ''`
										: `json[${jsonKey}]`;
									type = 'String';
								} else if (typeof element === 'number') {
									if (Number.isInteger(element)) {
										toType = shouldEnhanceFaultTolerance
											? `int.tryParse(json[${jsonKey}] ?? '')`
											: isWithDefaultValue
												? `json[${jsonKey}] ?? 0`
												: `json[${jsonKey}]`;
										type = 'num';
									} else {
										toType = shouldEnhanceFaultTolerance
											? `double.tryParse(json[${jsonKey}]?.toString() ?? '')`
											: isWithDefaultValue
												? `json[${jsonKey}] ?? 0.0`
												: `json[${jsonKey}]`;
										type = 'num';
									}
								}
							}
							
							propsLines.push(`  ${type}${shouldNullSafe ? '?' : ''} ${legalKey};\n`);
							fromJsonLines.push(`    ${legalKey} = ${toType};\n`);
							toJsonLines.push(`    data[${jsonKey}] = ${thisData}${legalKey};\n`);
						}
					}
				}

				if (shouldOridJson) {
					propsLines.push(`  Map<String, dynamic> __origJson = {};\n`);
				}

				if (shouldUsingJsonKey) {
					lines.unshift(jsonKeysLines.join('\n'));
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

				if (removeConstructors) constructorLines = [];
				lines.push(constructorLines.join(''));
				if (removeFromJson) fromJsonLines = [];
				lines.push(fromJsonLines.join(''));
				if (removeToJson) toJsonLines = [];
				lines.push(toJsonLines.join(''));

				if (shouldOridJson) {
					lines.push(`  Map<String, dynamic> origJson() => __origJson;`);
				}
				
				lines.push(`}\n`);

				/// TODO: linesOutput (dart code output)
				let linesPrefix;
				let linesSuffix;
				let linesFixed;
				if (shouldOridJson) {
					linesPrefix = lines.slice(-7);
					linesSuffix = lines.slice(0, -7).reverse();
					linesFixed = [...linesPrefix, ...linesSuffix];
				} else {
					linesPrefix = lines.slice(-6);
					linesSuffix = lines.slice(0, -6).reverse();
					linesFixed = [...linesPrefix, ...linesSuffix];
				}
				let linesOutput = linesFixed.join('\r\n');
				return linesOutput;
			};

			removeSurplusElement(jsonObj);

			let rootClass = $('#classNameTextField').val() ?? 'MyModel';

			let prefixDartCode = ``;

			let isShowJSONSource = $('#isShowJSONSource').prop('checked');
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
		checkBoxBinding('jsonKeyPrivateCheckBox', true);
		checkBoxBinding('usingJsonKeyCheckBox', false);
		checkBoxBinding('nullSafeCheckBox', true);
		checkBoxBinding('camelCheckBox', true);
		checkBoxBinding('faultToleranceCheckBox', false);
		checkBoxBinding('forceStringCheckBox', false);
		checkBoxBinding('origJsonCheckBox', false);
		// ~ new
		checkBoxBinding('removeFromJson', false);
		checkBoxBinding('removeToJson', false);
		checkBoxBinding('removeConstructors', false);
		checkBoxBinding('isWithDefaultValue', true);
		checkBoxBinding('isShowJSONSource', false);

		$('#usingJsonKeyCheckBox').on('change', function () {
			$('#jsonKeyPrivateCheckBox').prop('disabled', !(this.checked));
		});
		$('#jsonKeyPrivateCheckBox').prop('disabled', !($('#usingJsonKeyCheckBox').prop('checked')));

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