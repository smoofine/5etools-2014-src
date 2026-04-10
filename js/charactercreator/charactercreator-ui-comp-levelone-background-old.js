import {StatGenUiRenderLevelOneEntityBase} from "./charactercreator-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneBackground extends StatGenUiRenderLevelOneEntityBase {
	_title = "2. Background";
	_titleShort = "2. Background";
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
			<div class="ve-mb-1 ve-bold ve-text-large">Personality Traits</div>
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
							const traitType = colLabels[1]?.toLowerCase();
							
							if (traitType && traits[traitType]) {
								traits[traitType] = subEntry.rows.map(row => ({
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
			
			return `<div class="ve-mb-3">
				<div class="ve-bold ve-mb-1">${title}:</div>
				<div class="ve-flex-col" id="${containerId}">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 trait-selector-container">
							<!-- Trait selector will be inserted here -->
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

		// Add JavaScript for handling trait selection
		if (html !== "") {
			setTimeout(() => {
				this._initializeTraitSelectors(personalityData);
			}, 100);
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No personality traits available for this background.</div>`;
		}

		return html;
	}

	_initializeTraitSelectors (personalityData) {
		const { personalityTraits, ideals, bonds, flaws } = personalityData;
		
		const initializeSelector = (traits, type) => {
			if (traits.length === 0) return;
			
			const container = document.querySelector(`#${type}-selection-${Date.now()} .trait-selector-container`);
			const displayDiv = document.getElementById(`selected-${type}-selection-${Date.now()}`);
			
			if (container && displayDiv) {
				const traitProp = `common_selected${type.charAt(0).toUpperCase() + type.slice(1)}`;
				
				// Initialize state for trait selection
				if (!this._parent._state[traitProp]) {
					this._parent._state[traitProp] = null;
				}
				
				const {wrp: selTrait, setFnFilter: setFnFilterTrait} = ComponentUiUtil.getSelSearchable(
					this._parent,
					traitProp,
					{
						values: traits.map((_, i) => i),
						isAllowNull: true,
						fnDisplay: ix => {
							const trait = traits[ix];
							if (!trait) return "(Unknown)";
							return `${trait.roll}: ${trait.text}`;
						},
						asMeta: true,
					},
				);
				
				container.innerHTML = "";
				container.appendChild(selTrait);
				
				// Add filter functionality
				const doApplyFilterToSelTrait = () => {
					setFnFilterTrait(() => true);
				};
				
				doApplyFilterToSelTrait();
				
				// Update display when selection changes
				const updateDisplay = () => {
					const selectedIx = this._parent._state[traitProp];
					if (selectedIx != null && traits[selectedIx]) {
						displayDiv.innerHTML = `<strong>Selected:</strong> ${traits[selectedIx].text}`;
					} else {
						displayDiv.innerHTML = `No ${type} selected`;
					}
				};
				
				this._parent._addHookBase(traitProp, updateDisplay);
				updateDisplay();
			}
		};

		initializeSelector(personalityTraits, "personalityTrait");
		initializeSelector(ideals, "ideal");
		initializeSelector(bonds, "bond");
		initializeSelector(flaws, "flaw");
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

		// Show additional language selection with dropdown search
		if (additionalCount > 0) {
			let availableLanguages = [];
			
			if (chooseFrom.length > 0) {
				// Filter by specific choices
				availableLanguages = this._parent.languages.filter(lang => 
					chooseFrom.includes(lang.name)
				);
			} else if (anyStandard) {
				// Filter by standard languages only
				availableLanguages = this._parent.languages.filter(lang => 
					lang.type === "standard" || !lang.type
				);
			} else {
				// All languages available
				availableLanguages = this._parent.languages;
			}

			// Create unique container ID for this background selection
			const containerId = `background-language-selection-${Date.now()}`;
			
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Select ${additionalCount} additional ${additionalCount === 1 ? 'language' : 'languages'}:</div>
				<div class="ve-flex-col" id="${containerId}">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 background-language-selector-container">
							<!-- Language selector will be inserted here -->
						</div>
					</div>
					<div class="ve-small ve-muted ve-mt-1">
						<span id="background-language-count-${containerId}">0</span>/${additionalCount} languages selected
					</div>
				</div>
			</div>`;

			// Add JavaScript for handling language selection with dropdown
			setTimeout(() => {
				const container = document.querySelector(`#${containerId} .background-language-selector-container`);
				const countSpan = document.getElementById(`background-language-count-${containerId}`);
				
				if (container && countSpan) {
					// Create language selector using existing pattern
					const languageProp = `common_selectedBackgroundLanguages_${containerId}`;
					
					// Initialize state for language selection
					if (!this._parent._state[languageProp]) {
						this._parent._state[languageProp] = [];
					}
					
					const {wrp: selLanguage, setFnFilter: setFnFilterLanguage} = ComponentUiUtil.getSelSearchable(
						this._parent,
						languageProp,
						{
							values: availableLanguages.map((_, i) => i),
							isAllowNull: true,
							isMultiple: true,
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
						setFnFilterLanguage(() => true);
					};
					
					doApplyFilterToSelLanguage();
					
					// Update count when selection changes
					const updateCount = () => {
						const selected = this._parent._state[languageProp] || [];
						countSpan.textContent = selected.length;
						
						// Enforce limit
						if (selected.length > additionalCount) {
							this._parent._state[languageProp] = selected.slice(0, additionalCount);
							countSpan.textContent = additionalCount;
						}
					};
					
					this._parent._addHookBase(languageProp, updateCount);
					updateCount();
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

		// Show additional tool selection
		if (additionalCount > 0) {
			let availableTools = [];
			
			if (chooseFrom.length > 0) {
				// Use specific choices
				availableTools = chooseFrom;
			} else {
				// Generate tool options based on types
				if (anyArtisansTool) {
					availableTools.push("Artisan's tools (any type)");
				}
				if (anyGamingSet) {
					availableTools.push("Gaming set (any type)");
				}
				if (anyMusicalInstrument) {
					availableTools.push("Musical instrument (any type)");
				}
				
				// Add common tools
				availableTools.push("Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies", 
					"Cartographer's tools", "Carpenter's tools", "Cobbler's tools", "Cook's utensils", 
					"Glassblower's tools", "Jeweler's tools", "Leatherworker's tools", "Mason's tools", 
					"Painter's supplies", "Potter's tools", "Smith's tools", "Tinker's tools", 
					"Weaver's tools", "Woodcarver's tools", "Disguise kit", "Forgery kit", 
					"Herbalism kit", "Navigator's tools", "Poisoner's kit", "Thieves' tools");
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

			// Add JavaScript for handling tool selection
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
							fnDisplay: ix => availableTools[ix] || "(Unknown)",
							asMeta: true,
						},
					);
					
					container.innerHTML = "";
					container.appendChild(selTool);
					
					// Add filter functionality
					const doApplyFilterToSelTool = () => {
						setFnFilterTool(() => true);
					};
					
					doApplyFilterToSelTool();
					
					// Update count when selection changes
					const updateCount = () => {
						const selected = this._parent._state[toolProp] || [];
						countSpan.textContent = selected.length;
						
						// Enforce limit
						if (selected.length > additionalCount) {
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
}
