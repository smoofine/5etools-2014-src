import {StatGenUiRenderLevelOneEntityBase} from "./charactercreator-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneBackground extends StatGenUiRenderLevelOneEntityBase {
	_title = "Background";
	_titleShort = "Background";
	_propIxEntity = "common_ixBackground";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetBackground";
	_propData = "_backgrounds";
	_propModalFilter = "_modalFilterBackgrounds";
	_propIsPreview = "common_isPreviewBackground";
	_propEntity = "background";
	_page = UrlUtil.PG_BACKGROUNDS;
	_propChoiceMetasFrom = "common_backgroundChoiceMetasFrom";
	_propChoiceWeighted = "common_backgroundChoiceMetasWeighted";

	render () {
		const out = super.render();

		// Add personality traits selection
		const {stgPersonalityTraits, dispPersonalityTraits} = this._getPtsPersonalityTraits();
		out.stgSel.appends(stgPersonalityTraits);
		out.dispPersonalityTraits = dispPersonalityTraits;

		// Add language selection
		const {stgLanguages, dispLanguages} = this._getPtsLanguages();
		out.stgSel.appends(stgLanguages);
		out.dispLanguages = dispLanguages;

		// Add tool selection
		const {stgTools, dispTools} = this._getPtsTools();
		out.stgSel.appends(stgTools);
		out.dispTools = dispTools;

		// Add skill proficiencies
		const {stgSkills, dispSkills} = this._getPtsSkills();
		out.stgSel.appends(stgSkills);
		out.dispSkills = dispSkills;

		// Add equipment
		const {stgEquipment, dispEquipment} = this._getPtsEquipment();
		out.stgSel.appends(stgEquipment);
		out.dispEquipment = dispEquipment;

		// Add divider from base class
		out.divider = out.divider;

		return out;
	}

	_pb_getAbilityList () {
		return this._parent._pb_getBackgroundAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getBackgroundAbility();
	}

	_getPtsPersonalityTraits () {
		const stgPersonalityTraits = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Suggested Characteristics</div>
			<div class="ve-flex-col" id="background-personality-container">
				<div class="ve-italic ve-muted">Select a background to see personality options...</div>
			</div>
		</div>`;

		const dispPersonalityTraits = ee`<div class="ve-flex-col"></div>`;

		// Hook to update personality selection when background changes
		const hkBackground = () => {
			const background = this._parent.background;
			if (!background) {
				stgPersonalityTraits.find("#background-personality-container").html(`<div class="ve-italic ve-muted">Select a background to see personality options...</div>`);
				return;
			}

			const personalityData = this._parseBackgroundPersonalityTraits(background);
			const personalityHtml = this._renderPersonalityTraitSelection(personalityData);
			stgPersonalityTraits.find("#background-personality-container").html(personalityHtml);
		};
		this._parent._addHookBase("common_ixBackground", hkBackground);
		hkBackground();

		return {
			stgPersonalityTraits,
			dispPersonalityTraits,
		};
	}

	_parseBackgroundPersonalityTraits (background) {
		const traits = {
			personalityTraits: [],
			ideals: [],
			bonds: [],
			flaws: []
		};

		// Find "Suggested Characteristics" section
		if (background.entries) {
			background.entries.forEach(entry => {
				if (entry.type === "entries" && entry.name === "Suggested Characteristics" && entry.entries) {
					entry.entries.forEach(subEntry => {
						if (subEntry.type === "table" && subEntry.rows) {
							const colLabels = subEntry.colLabels || [];
							const traitType = colLabels[1]?.toLowerCase().replace(/\s+/g, '');
							
							// Map trait types to our object keys
							const traitMapping = {
								'personalitytrait': 'personalityTraits',
								'ideal': 'ideals',
								'bond': 'bonds',
								'flaw': 'flaws'
							};
							
							const mappedType = traitMapping[traitType];
							if (mappedType && traits[mappedType]) {
								traits[mappedType] = subEntry.rows.map(row => ({
									roll: row[0],
									text: row[1]
								}));
							}
						}
					});
				}
			});
		}

		return traits;
	}

	_renderPersonalityTraitSelection (personalityData) {
		const { personalityTraits, ideals, bonds, flaws } = personalityData;
		
		let html = "";

		const renderTraitSelector = (title, traits, type) => {
			if (traits.length === 0) return "";
			
			const containerId = `${type}-selection-${Date.now()}`;
			
			// Determine dice type based on number of traits
			const diceType = traits.length === 8 ? 'd8' : traits.length === 6 ? 'd6' : traits.length === 4 ? 'd4' : 'd20';
			
			return `<div class="ve-mb-3">
				<div class="ve-bold ve-mb-1">${title}:</div>
				<div class="ve-flex-col" id="${containerId}">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2">
							<div class="${type}-dropdown-container" style="width: 100%; max-width: 100%;">
								<select class="form-control ve-select ${type}-dropdown" id="${type}-dropdown-${containerId}" style="width: 100%; max-width: 100%; white-space: normal; word-wrap: break-word; min-width: 200px;">
									<option value="">Select a ${title.toLowerCase()}...</option>
									${traits.map((trait, index) => 
										`<option value="${index}" style="white-space: normal; word-wrap: break-word;">${trait.roll}: ${trait.text}</option>`
									).join("")}
								</select>
								<input type="text" class="form-control ve-input ${type}-custom-input" id="${type}-custom-${containerId}" placeholder="Enter custom ${title.toLowerCase()}..." style="width: 100%; max-width: 100%; white-space: normal; word-wrap: break-word; min-width: 200px; display: none;">
							</div>
							<button class="ve-btn ve-btn-xs ve-btn-default" title="Click to roll. SHIFT/CTRL to roll twice." onmousedown="event.preventDefault()" data-packed-dice='{"type":"dice","rollable":true,"toRoll":"${diceType}","displayText":"${diceType}"}'>
								${diceType}
							</button>
							<button class="ve-btn ve-btn-xs ve-btn-default ${type}-custom-toggle" title="Toggle custom input" onmousedown="event.preventDefault()">
								\u270D
							</button>
						</div>
					</div>
					<div class="ve-small ve-muted ve-mt-1" id="selected-${type}-${containerId}">
						No ${type} selected
					</div>
				</div>
			</div>`;
		};

		html += renderTraitSelector("Personality Trait", personalityTraits, "personalityTrait");
		html += renderTraitSelector("Ideal", ideals, "ideal");
		html += renderTraitSelector("Bond", bonds, "bond");
		html += renderTraitSelector("Flaw", flaws, "flaw");

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No personality traits available for this background.</div>`;
		}

		// Add JavaScript to handle dropdown changes and dice rolling
		if (html !== "") {
			setTimeout(() => {
				this._initializeTraitDropdowns(personalityData);
			}, 100);
		}

		return html;
	}

	_initializeTraitDropdowns (personalityData) {
		const { personalityTraits, ideals, bonds, flaws } = personalityData;
		
		const initializeDropdown = (traits, type) => {
			if (traits.length === 0) return;
			
			// Find the dropdown containers and selected displays for this type
			const dropdownContainers = document.querySelectorAll(`.${type}-dropdown-container`);
			const selectedDisplays = document.querySelectorAll(`[id^="selected-${type}-"]`);
			
			dropdownContainers.forEach((container, index) => {
				const dropdown = container.querySelector(`.${type}-dropdown`);
				const customInput = container.querySelector(`.${type}-custom-input`);
				const toggleBtn = container.parentElement.querySelector(`.${type}-custom-toggle`);
				const selectedDisplay = selectedDisplays[index];
				
				if (!dropdown || !customInput || !toggleBtn || !selectedDisplay) return;
				
				// Set initial toggle button state based on actual display state
				const isCustomMode = customInput.style.display === 'block';
				if (isCustomMode) {
					toggleBtn.innerHTML = '\u2611'; // ☑ - custom mode
					toggleBtn.title = 'Toggle dropdown selection';
				} else {
					toggleBtn.innerHTML = '\u270E'; // ✎ - dropdown mode
					toggleBtn.title = 'Toggle custom input';
				}
				
				// Handle dropdown change
				dropdown.addEventListener('change', (e) => {
					const target = e.target;
					const selectedIndex = parseInt(target.value);
					if (selectedIndex >= 0 && traits[selectedIndex]) {
						selectedDisplay.innerHTML = `<strong>Selected:</strong> ${traits[selectedIndex].text}`;
					} else {
						selectedDisplay.innerHTML = `No ${type} selected`;
					}
				});
				
				// Handle custom input change
				customInput.addEventListener('input', (e) => {
					const value = e.target.value.trim();
					if (value) {
						selectedDisplay.innerHTML = `<strong>Custom:</strong> ${value}`;
					} else {
						selectedDisplay.innerHTML = `No ${type} selected`;
					}
				});
				
				// Handle dice roll
				const roller = container.parentElement.querySelector('button:not(.custom-toggle)');
				if (roller) {
					roller.addEventListener('click', () => {
						const diceType = roller.getAttribute('data-packed-dice').match(/"toRoll":"([^"]+)"/)[1];
						const maxRoll = diceType === 'd8' ? 8 : diceType === 'd6' ? 6 : diceType === 'd4' ? 4 : 20;
						const roll = Math.floor(Math.random() * maxRoll) + 1;
						const traitIndex = roll - 1;
						
						if (traits[traitIndex]) {
							dropdown.value = traitIndex.toString();
							selectedDisplay.innerHTML = `<strong>Selected (rolled ${roll}):</strong> ${traits[traitIndex].text}`;
						}
					});
				}
				
				// Handle custom toggle
				toggleBtn.addEventListener('click', () => {
					const isCustomMode = customInput.style.display === 'block';
					
					if (isCustomMode) {
						// Switch to dropdown mode
						customInput.style.display = 'none';
						dropdown.style.display = 'block';
						toggleBtn.innerHTML = '\u270E';
						toggleBtn.title = 'Toggle custom input';
					} else {
						// Switch to custom input mode
						dropdown.style.display = 'none';
						customInput.style.display = 'block';
						toggleBtn.innerHTML = '\u2611';
						toggleBtn.title = 'Toggle dropdown selection';
						customInput.focus();
					}
				});
			});
		};

		initializeDropdown(personalityTraits, "personalityTrait");
		initializeDropdown(ideals, "ideal");
		initializeDropdown(bonds, "bond");
		initializeDropdown(flaws, "flaw");
	}

	_getPtsLanguages () {
		const stgLanguages = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Language Proficiencies</div>
			<div class="ve-flex-col" id="background-languages-container">
				<div class="ve-italic ve-muted">Select a background to see language options...</div>
			</div>
		</div>`;

		const dispLanguages = ee`<div class="ve-flex-col"></div>`;

		// Hook to update language selection when background changes
		const hkBackground = () => {
			const background = this._parent.background;
			if (!background) {
				stgLanguages.find("#background-languages-container").html(`<div class="ve-italic ve-muted">Select a background to see language options...</div>`);
				return;
			}

			const languageData = this._parseBackgroundLanguages(background);
			const languageHtml = this._renderLanguageSelection(languageData);
			stgLanguages.find("#background-languages-container").html(languageHtml);
		};
		this._parent._addHookBase("common_ixBackground", hkBackground);
		hkBackground();

		return {
			stgLanguages,
			dispLanguages,
		};
	}

	_parseBackgroundLanguages (background) {
		const predetermined = [];
		let additionalCount = 0;
		let anyStandard = false;
		let chooseFrom = [];

		// Parse languageProficiencies from background data
		if (background.languageProficiencies) {
			background.languageProficiencies.forEach(lp => {
				if (lp.anyStandard) {
					additionalCount = Math.max(additionalCount, lp.anyStandard);
					anyStandard = true;
				}
				if (lp.choose && lp.choose.from) {
					chooseFrom = lp.choose.from;
					additionalCount = Math.max(additionalCount, 1);
				}
			});
		}

		return {
			predetermined,
			additionalCount,
			anyStandard,
			chooseFrom,
		};
	}

	_renderLanguageSelection (languageData) {
		const { predetermined, additionalCount, anyStandard, chooseFrom } = languageData;
		
		let html = "";

		// Show predetermined languages
		if (predetermined.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Predetermined Languages:</div>
				<div class="ve-flex ve-flex-wrap">
					${predetermined.map(lang => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${lang}</div>`
					).join("")}
				</div>
			</div>`;
		}

		// Show additional language selection with separate dropdowns for each slot
		if (additionalCount > 0) {
			const availableLanguages = this._parent.languages.filter(lang => {
				// Filter out predetermined languages
				if (predetermined.includes(lang.name)) return false;
				
				// Filter based on language type restrictions
				if (anyStandard && chooseFrom.length === 0) {
					return lang.type === "standard" || !lang.type; // Include standard and untyped languages
				}
				if (chooseFrom.length > 0) {
					return chooseFrom.includes(lang.name);
				}
				return true; // No restrictions
			});

			// Create unique container ID for this background selection
			const containerId = `background-language-selection-${Date.now()}`;
			
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Select ${additionalCount} additional ${additionalCount === 1 ? 'language' : 'languages'}:</div>
				<div class="ve-flex-col" id="${containerId}">
					${Array.from({length: additionalCount}, (_, index) => 
						`<div class="ve-flex-v-center ve-mb-2">
							<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 background-language-selector-container-${index}">
								<!-- Language selector ${index + 1} will be inserted here -->
							</div>
						</div>`
					).join("")}
				</div>
			</div>`;

			// Add JavaScript for handling language selection with separate dropdowns
			setTimeout(() => {
				for (let i = 0; i < additionalCount; i++) {
					const container = document.querySelector(`#${containerId} .background-language-selector-container-${i}`);
					
					if (container) {
						// Create language selector for this slot
						const languageProp = `common_selectedBackgroundLanguage_${containerId}_${i}`;
						
						// Initialize state for this language slot
						if (!this._parent._state[languageProp]) {
							this._parent._state[languageProp] = null;
						}
						
						const {wrp: selLanguage, setFnFilter: setFnFilterLanguage} = ComponentUiUtil.getSelSearchable(
							this._parent,
							languageProp,
							{
								values: availableLanguages.map((_, index) => index),
								isAllowNull: true,
								fnDisplay: ix => {
									const lang = availableLanguages[ix];
									if (!lang) return "(Unknown)";
									return `${lang.name}${lang.type ? ` (${lang.type})` : ""}`;
								},
								asMeta: true,
							},
						);
						
						container.innerHTML = "";
						container.appendChild(selLanguage);
						
						// Add filter functionality
						const doApplyFilterToSelLanguage = () => {
							// Filter out already selected languages from other slots
							const selectedLanguages = [];
							for (let j = 0; j < additionalCount; j++) {
								const otherProp = `common_selectedBackgroundLanguage_${containerId}_${j}`;
								const selectedIndex = this._parent._state[otherProp];
								if (selectedIndex != null && availableLanguages[selectedIndex]) {
									selectedLanguages.push(availableLanguages[selectedIndex].name);
								}
							}
							
							setFnFilterLanguage(ix => {
								const lang = availableLanguages[ix];
								if (!lang) return true;
								// Don't show languages already selected in other slots
								return !selectedLanguages.includes(lang.name);
							});
						};
						
						doApplyFilterToSelLanguage();
						
						// Update filters when any language selection changes
						this._parent._addHookBase(languageProp, () => {
							// Update all other language dropdowns to remove duplicates
							for (let j = 0; j < additionalCount; j++) {
								if (j !== i) {
									const otherProp = `common_selectedBackgroundLanguage_${containerId}_${j}`;
									this._parent._addHookBase(otherProp, doApplyFilterToSelLanguage);
								}
							}
							doApplyFilterToSelLanguage();
						});
					}
				}
			}, 100);
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No language proficiencies available for this background.</div>`;
		}

		return html;
	}

	_getPtsTools () {
		const stgTools = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Tool Proficiencies</div>
			<div class="ve-flex-col" id="background-tools-container">
				<div class="ve-italic ve-muted">Select a background to see tool options...</div>
			</div>
		</div>`;

		const dispTools = ee`<div class="ve-flex-col"></div>`;

		// Hook to update tool selection when background changes
		const hkBackground = () => {
			const background = this._parent.background;
			if (!background) {
				stgTools.find("#background-tools-container").html(`<div class="ve-italic ve-muted">Select a background to see tool options...</div>`);
				return;
			}

			const toolData = this._parseBackgroundTools(background);
			const toolHtml = this._renderToolSelection(toolData);
			stgTools.find("#background-tools-container").html(toolHtml);
		};
		this._parent._addHookBase("common_ixBackground", hkBackground);
		hkBackground();

		return {
			stgTools,
			dispTools,
		};
	}

	_parseBackgroundTools (background) {
		const predetermined = [];
		let additionalCount = 0;
		let chooseFrom = [];
		let anyArtisansTool = false;
		let anyGamingSet = false;
		let anyMusicalInstrument = false;

		// Parse toolProficiencies from background data
		if (background.toolProficiencies) {
			background.toolProficiencies.forEach(tp => {
				// Check for predetermined tools
				Object.keys(tp).forEach(tool => {
					if (tp[tool] === true && tool !== "choose" && tool !== "anyArtisansTool" && 
						tool !== "anyGamingSet" && tool !== "anyMusicalInstrument") {
						predetermined.push(tool);
					}
				});

				// Check for choose options
				if (tp.choose && tp.choose.from) {
					chooseFrom = tp.choose.from;
					additionalCount = Math.max(additionalCount, 1);
				}

				// Check for any tool types
				if (tp.anyArtisansTool) {
					anyArtisansTool = true;
					additionalCount = Math.max(additionalCount, tp.anyArtisansTool);
				}
				if (tp.anyGamingSet) {
					anyGamingSet = true;
					additionalCount = Math.max(additionalCount, tp.anyGamingSet);
				}
				if (tp.anyMusicalInstrument) {
					anyMusicalInstrument = true;
					additionalCount = Math.max(additionalCount, tp.anyMusicalInstrument);
				}
			});
		}

		return {
			predetermined,
			additionalCount,
			chooseFrom,
			anyArtisansTool,
			anyGamingSet,
			anyMusicalInstrument,
		};
	}

	_renderToolSelection (toolData) {
		const { predetermined, additionalCount, chooseFrom, anyArtisansTool, anyGamingSet, anyMusicalInstrument } = toolData;
		
		let html = "";

		// Show predetermined tools
		if (predetermined.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Predetermined Tools:</div>
				<div class="ve-flex ve-flex-wrap">
					${predetermined.map(tool => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${tool}</div>`
					).join("")}
				</div>
			</div>`;
		}

		// Show additional tool selection with dropdown search
		if (additionalCount > 0) {
			let availableTools = [];
			
			if (chooseFrom.length > 0) {
				// Use specific choices
				availableTools = chooseFrom.map(tool => ({ name: tool, type: "choice" }));
			} else {
				// Generate tool options based on types
				if (anyArtisansTool) {
					availableTools.push({ name: "Artisan's tools (any type)", type: "artisan" });
				}
				if (anyGamingSet) {
					availableTools.push({ name: "Gaming set (any type)", type: "gaming" });
				}
				if (anyMusicalInstrument) {
					availableTools.push({ name: "Musical instrument (any type)", type: "instrument" });
				}
				
				// Add common tools
				const commonTools = [
					"Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies", 
					"Cartographer's tools", "Carpenter's tools", "Cobbler's tools", "Cook's utensils", 
					"Glassblower's tools", "Jeweler's tools", "Leatherworker's tools", "Mason's tools", 
					"Painter's supplies", "Potter's tools", "Smith's tools", "Tinker's tools", 
					"Weaver's tools", "Woodcarver's tools", "Disguise kit", "Forgery kit", 
					"Herbalism kit", "Navigator's tools", "Poisoner's kit", "Thieves' tools"
				];
				
				commonTools.forEach(tool => {
					availableTools.push({ name: tool, type: "common" });
				});
			}

			// Create unique container ID for this background tool selection
			const containerId = `background-tool-selection-${Date.now()}`;
			
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Select ${additionalCount} additional ${additionalCount === 1 ? 'tool' : 'tools'}:</div>
				<div class="ve-flex-col" id="${containerId}">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 background-tool-selector-container">
							<!-- Tool selector will be inserted here -->
						</div>
					</div>
					<div class="ve-small ve-muted ve-mt-1">
						<span id="background-tool-count-${containerId}">0</span>/${additionalCount} tools selected
					</div>
				</div>
			</div>`;

			// Add JavaScript for handling tool selection with dropdown
			setTimeout(() => {
				const container = document.querySelector(`#${containerId} .background-tool-selector-container`);
				const countSpan = document.getElementById(`background-tool-count-${containerId}`);
				
				if (container && countSpan) {
					// Create tool selector using existing pattern
					const toolProp = `common_selectedBackgroundTools_${containerId}`;
					
					// Initialize state for tool selection
					if (!this._parent._state[toolProp]) {
						this._parent._state[toolProp] = [];
					}
					
					const {wrp: selTool, setFnFilter: setFnFilterTool} = ComponentUiUtil.getSelSearchable(
						this._parent,
						toolProp,
						{
							values: availableTools.map((_, i) => i),
							isAllowNull: true,
							isMultiple: true,
							fnDisplay: ix => {
								const tool = availableTools[ix];
								if (!tool) return "(Unknown)";
								return `${tool.name}${tool.type && tool.type !== "common" ? ` (${tool.type})` : ""}`;
							},
							asMeta: true,
						},
					);
					
					container.innerHTML = "";
					container.appendChild(selTool);
					
					// Add filter functionality
					const doApplyFilterToSelTool = () => {
						// For now, show all tools since we already filtered them
						setFnFilterTool(() => true);
					};
					
					doApplyFilterToSelTool();
					
					// Update count when selection changes
					const updateCount = () => {
						const selected = this._parent._state[toolProp] || [];
						countSpan.textContent = selected.length;
						
						// Enforce limit
						if (selected.length > additionalCount) {
							// Remove excess selections
							this._parent._state[toolProp] = selected.slice(0, additionalCount);
							countSpan.textContent = additionalCount;
						}
					};
					
					this._parent._addHookBase(toolProp, updateCount);
					updateCount();
				}
			}, 100);
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No tool proficiencies available for this background.</div>`;
		}

		return html;
	}

	_getPtsSkills () {
		const stgSkills = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Skill Proficiencies</div>
			<div class="ve-flex-col" id="background-skills-container">
				<div class="ve-italic ve-muted">Select a background to see skill proficiencies...</div>
			</div>
		</div>`;

		const dispSkills = ee`<div class="ve-flex-col"></div>`;

		// Hook to update skill proficiencies when background changes
		const hkBackground = () => {
			const background = this._parent.background;
			if (!background) {
				stgSkills.find("#background-skills-container").html(`<div class="ve-italic ve-muted">Select a background to see skill proficiencies...</div>`);
				return;
			}

			const skillData = this._parseBackgroundSkills(background);
			const skillHtml = this._renderSkillSelection(skillData);
			stgSkills.find("#background-skills-container").html(skillHtml);
		};
		this._parent._addHookBase("common_ixBackground", hkBackground);
		hkBackground();

		return {
			stgSkills,
			dispSkills,
		};
	}

	_parseBackgroundSkills (background) {
		const skills = [];

		// Parse skillProficiencies from background data
		if (background.skillProficiencies) {
			background.skillProficiencies.forEach(sp => {
				// Check for predetermined skills
				Object.keys(sp).forEach(skill => {
					if (sp[skill] === true && skill !== "choose") {
						skills.push(skill);
					}
				});

				// Check for choose options
				if (sp.choose && sp.choose.from) {
					sp.choose.from.forEach(skill => {
						skills.push(`${skill} (choice)`);
					});
				}
			});
		}

		return skills;
	}

	_renderSkillSelection (skills) {
		let html = "";

		// Show skill proficiencies
		if (skills.length > 0) {
			html += `<div class="ve-flex ve-flex-wrap">
				${skills.map(skill => 
					`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${skill}</div>`
				).join("")}
			</div>`;
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No skill proficiencies available for this background.</div>`;
		}

		return html;
	}

	_getPtsEquipment () {
		const stgEquipment = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Equipment</div>
			<div class="ve-flex-col" id="background-equipment-container">
				<div class="ve-italic ve-muted">Select a background to see equipment...</div>
			</div>
		</div>`;

		const dispEquipment = ee`<div class="ve-flex-col"></div>`;

		// Hook to update equipment when background changes
		const hkBackground = () => {
			const background = this._parent.background;
			if (!background) {
				stgEquipment.find("#background-equipment-container").html(`<div class="ve-italic ve-muted">Select a background to see equipment...</div>`);
				return;
			}

			const equipmentData = this._parseBackgroundEquipment(background);
			const equipmentHtml = this._renderEquipmentSelection(equipmentData);
			stgEquipment.find("#background-equipment-container").html(equipmentHtml);
		};
		this._parent._addHookBase("common_ixBackground", hkBackground);
		hkBackground();

		return {
			stgEquipment,
			dispEquipment,
		};
	}

	_parseBackgroundEquipment (background) {
		const equipment = [];

		// Parse startingEquipment from background data
		if (background.startingEquipment) {
			background.startingEquipment.forEach(equipmentGroup => {
				// Handle different choice group structures
				Object.keys(equipmentGroup).forEach(groupKey => {
					const group = equipmentGroup[groupKey];
					
					if (Array.isArray(group)) {
						group.forEach(item => {
							if (typeof item === 'string') {
								// Handle string items (e.g., "common clothes|phb")
								const itemName = item.split('|')[0]; // Remove source suffix
								equipment.push(itemName);
							} else if (item.displayName) {
								// Handle items with displayName (e.g., holy symbol)
								equipment.push(item.displayName);
							} else if (item.special) {
								// Handle special items with quantity
								const specialName = item.special;
								if (item.quantity) {
									equipment.push(`${item.quantity} ${specialName}`);
								} else {
									equipment.push(specialName);
								}
							} else if (item.item) {
								// Handle items with item reference
								const itemName = item.item.split('|')[0]; // Remove source suffix
								equipment.push(itemName);
							} else if (item.containsValue) {
								// Handle containers with money
								const gpAmount = item.containsValue / 100; // Convert from copper to gold
								equipment.push(`belt pouch containing ${gpAmount} gp`);
							}
						});
					}
				});
			});
		}

		return equipment;
	}

	_renderEquipmentSelection (equipment) {
		let html = "";

		// Show equipment
		if (equipment.length > 0) {
			html += `<div class="ve-flex ve-flex-wrap">
				${equipment.map(item => 
					`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${item}</div>`
				).join("")}
			</div>`;
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No equipment available for this background.</div>`;
		}

		return html;
	}
}
