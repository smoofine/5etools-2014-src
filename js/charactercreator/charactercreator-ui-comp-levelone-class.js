import {StatGenUiRenderLevelOneEntityBase} from "./charactercreator-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneClass extends StatGenUiRenderLevelOneEntityBase {
	_title = "Class";
	_titleShort = "Class";
	_propIxEntity = "common_ixClass";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetClass";
	_propData = "_classes";
	_propModalFilter = "_modalFilterClasses";
	_propIsPreview = "common_isPreviewClass";
	_propEntity = "class";
	_page = UrlUtil.PG_CLASSES;
	_propChoiceMetasFrom = "common_classChoiceMetasFrom";
	_propChoiceWeighted = "common_classChoiceMetasWeighted";

	render () {
		// Use the standard modal filter system like races
		const out = super.render();

		// Add proficiencies display
		const {stgProficiencies, dispProficiencies} = this._getPtsProficiencies();
		out.stgSel.appendChild(stgProficiencies);
		out.dispProficiencies = dispProficiencies;

		// Add subclass selection
		const {stgSubclass, dispSubclass} = this._getPtsSubclass();
		out.stgSel.appendChild(stgSubclass);
		out.dispSubclass = dispSubclass;

		// Add level 1 spells and cantrips selection
		const {stgSpells, dispSpells} = this._getPtsSpells();
		out.stgSel.appendChild(stgSpells);
		out.dispSpells = dispSpells;

		// Add starting equipment
		const {stgEquipment, dispEquipment} = this._getPtsEquipment();
		out.stgSel.appendChild(stgEquipment);
		out.dispEquipment = dispEquipment;

		out.wrpOuter.appendChild(out.stgSel);

		return out;
	}

	_pb_getAbilityList () {
		return this._parent._pb_getClassAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getClassAbility();
	}

	
	_getPtsSubclass () {
		const stgSubclass = document.createElement("div");
		stgSubclass.className = "ve-flex-col ve-w-100";
		
		// Get class-specific subclass terminology
		const getSubclassLabel = (className) => {
			switch (className) {
				case "Cleric": return "Divine Domain";
				case "Sorcerer": return "Sorcerous Origin";
				case "Warlock": return "Otherworldly Patron";
				default: return "Subclass"; // Show "Subclass" for all other classes
			}
		};

		const currentClass = this._parent.class;
		const subclassLabel = currentClass ? getSubclassLabel(currentClass.name) : "Subclass";

		// Always create the structure
		stgSubclass.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">${subclassLabel}</div>
			<div class="ve-flex-col" id="class-subclass-container">
				<div class="ve-italic ve-muted">Select a class to see ${subclassLabel.toLowerCase()} options...</div>
			</div>
		`;

		const dispSubclass = document.createElement("div");
		dispSubclass.className = "ve-flex-col";

		// Hook to update subclass selection when class changes
		const hkClass = async () => {
			const classData = this._parent.class;
			if (!classData) {
				stgSubclass.style.display = "none";
				return;
			}

			// Always show the section
			stgSubclass.style.display = "";
			
			// Get the appropriate label for this class
			const newSubclassLabel = getSubclassLabel(classData.name);
			const labelElement = stgSubclass.querySelector(".ve-bold");
			if (labelElement) labelElement.textContent = newSubclassLabel;

			const container = stgSubclass.querySelector("#class-subclass-container");
			
			// Use dropdown for Cleric, Sorcerer, and Warlock
			if (["Cleric", "Sorcerer", "Warlock"].includes(classData.name)) {
				const subclassHtml = await this._renderSubclassDropdown(classData.name, newSubclassLabel);
				if (container) container.innerHTML = subclassHtml;
				
				// Add toggle-based preview event handling for dropdown
				setTimeout(() => {
					const subclassSelect = container.querySelector("#subclass-select");
					const toggleButton = container.querySelector("#subclass-preview-toggle");
					const previewContainer = container.querySelector("#subclass-preview-container");
					
					// Handle dropdown change
					if (subclassSelect) {
						subclassSelect.addEventListener("change", () => {
							const selectedOption = subclassSelect.options[subclassSelect.selectedIndex];
							const shortName = subclassSelect.value;
							const source = selectedOption.getAttribute("data-source");
							
							// Hide all subclass previews first
							const allPreviews = container.querySelectorAll("[data-subclass-id]");
							allPreviews.forEach(preview => preview.classList.add("ve-hidden"));
							
							// Show the selected subclass preview if toggle is active
							if (!previewContainer.classList.contains("ve-hidden")) {
								if (shortName && source) {
									const stateKey = `subclass_${classData.name}_${shortName}_${source}`;
									const selectedPreview = container.querySelector(`[data-subclass-id="${stateKey}"]`);
									if (selectedPreview) {
										selectedPreview.classList.remove("ve-hidden");
									} else {
										// Show test preview if specific subclass preview not found
										const testPreview = container.querySelector(`[data-subclass-id="test_preview"]`);
										if (testPreview) {
											testPreview.classList.remove("ve-hidden");
										}
									}
								} else {
									// Show test preview when no subclass is selected
									const testPreview = container.querySelector(`[data-subclass-id="test_preview"]`);
									if (testPreview) {
										testPreview.classList.remove("ve-hidden");
									}
								}
							}
						});
					}
					
					// Handle toggle button click
					if (toggleButton && previewContainer) {
						toggleButton.addEventListener("click", () => {
							const isHidden = previewContainer.classList.contains("ve-hidden");
							
							if (isHidden) {
								// Show preview container
								previewContainer.classList.remove("ve-hidden");
								toggleButton.classList.add("ve-active");
								
								// Trigger the current selection to show the right preview
								if (subclassSelect) {
									subclassSelect.dispatchEvent(new Event("change"));
								}
							} else {
								// Hide preview container
								previewContainer.classList.add("ve-hidden");
								toggleButton.classList.remove("ve-active");
							}
						});
					}
				}, 100);
			} else {
				// Use original method for other classes
				const subclassData = this._parseClassSubclasses(classData);
				const subclassHtml = this._renderSubclassSelection(subclassData, newSubclassLabel);
				if (container) container.innerHTML = subclassHtml;
			}
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		// Initial state - hide if no class selected
		if (!currentClass) {
			stgSubclass.style.display = "none";
		}

		return {
			stgSubclass,
			dispSubclass,
		};
	}

	_parseClassSubclasses (classData) {
		if (!classData.subclasses || !classData.subclasses.length) {
			return null;
		}

		return {
			subclasses: classData.subclasses.map(sc => ({
				name: sc.name,
				shortName: sc.shortName || sc.name,
				source: sc.source,
				levels: sc.levels || []
			}))
		};
	}

	_renderSubclassSelection (subclassData, subclassLabel = "Subclass") {
		if (!subclassData || !subclassData.subclasses.length) {
			return `<div class="ve-italic ve-muted">No ${subclassLabel} at level 1.</div>`;
		}

		return `<div class="ve-flex-col">
			${subclassData.subclasses.map(sc => `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-clickable ve-border ve-rounded ve-mb-1" data-subclass-name="${sc.name}" data-subclass-source="${sc.source}">
					<div class="ve-flex-col">
						<div class="ve-bold">${sc.name}</div>
						<div class="ve-small ve-muted">${sc.source !== Parser.SRC_PHB ? `[${Parser.sourceJsonToAbv(sc.source)}]` : ""}</div>
					</div>
				</div>
			`).join('')}
		</div>`;
	}

	async _getSubclassOptionsFromLookup (className) {
		try {
			const subclassLookup = await DataUtil.loadJSON(`${Renderer.get().baseUrl}data/generated/gendata-subclass-lookup.json`);
			const classData = this._parent.class;
			const options = [];

			// Load official subclasses from lookup data
			if (classData && subclassLookup[classData.source] && subclassLookup[classData.source][className]) {
				const classSubclasses = subclassLookup[classData.source][className];
				
				// Iterate through all sources for this class
				Object.keys(classSubclasses).forEach(source => {
					const sourceSubclasses = classSubclasses[source];
					Object.keys(sourceSubclasses).forEach(subclassKey => {
						const subclass = sourceSubclasses[subclassKey];
						options.push({
							name: subclass.name,
							shortName: subclassKey,
							source: source
						});
					});
				});
			}

			// Load homebrew subclasses directly from homebrew data
			if (classData && classData.subclasses) {
				classData.subclasses.forEach(subclass => {
					// Skip if this is already in the lookup data (avoid duplicates)
					const exists = options.some(opt => opt.name === subclass.name && opt.source === subclass.source);
					if (!exists) {
						options.push({
							name: subclass.name,
							shortName: subclass.shortName || subclass.name.toLowerCase().replace(/\s+/g, ''),
							source: subclass.source
						});
					}
				});
			}

			// Also load homebrew subclasses from the global homebrew data
			const brewSubclasses = BrewUtil2.getBrewProcessedFromCache("subclass") || [];
			brewSubclasses.forEach(subclass => {
				// Check if this subclass belongs to the current class
				if (subclass.className === className) {
					// Skip if this is already in the options (avoid duplicates)
					const exists = options.some(opt => opt.name === subclass.name && opt.source === subclass.source);
					if (!exists) {
						options.push({
							name: subclass.name,
							shortName: subclass.shortName || subclass.name.toLowerCase().replace(/\s+/g, ''),
							source: subclass.source
						});
					}
				}
			});

			return options.sort((a, b) => a.name.localeCompare(b.name));
		} catch (e) {
			console.error("Failed to load subclass lookup data:", e);
			return [];
		}
	}

	async _renderSubclassDropdown (className, subclassLabel) {
		const subclassOptions = await this._getSubclassOptionsFromLookup(className);
		
		if (!subclassOptions.length) {
			return `<div class="ve-italic ve-muted">No ${subclassLabel} at level 1.</div>`;
		}

		// Generate preview content for each subclass
		const previewContent = await this._generateSubclassPreviews(className, subclassOptions);

		return `<div class="ve-flex-col">
			<div class="ve-flex-v-center ve-mb-2">
				<select class="ve-form-control ve-input-xs form-control--minimal ve-flex-1" id="subclass-select">
					<option value="">Select a ${subclassLabel.toLowerCase()}...</option>
					${subclassOptions.map(option => `
						<option value="${option.shortName}" data-source="${option.source}">
							${option.name}${option.source !== "PHB" ? ` [${Parser.sourceJsonToAbv(option.source)}]` : ""}
						</option>
					`).join('')}
				</select>
				<button class="ve-btn ve-btn-xs ve-btn-default ve-ml-2" id="subclass-preview-toggle" title="Toggle ${subclassLabel} Preview">
					<span class="glyphicon glyphicon-eye-open"></span>
				</button>
			</div>
			<div class="ve-flex-col ve-mb-2 ve-hidden" id="subclass-preview-container">
				${previewContent}
			</div>
		</div>`;
	}

	_getPtsSpells () {
		const stgSpells = document.createElement("div");
		stgSpells.className = "ve-flex-col ve-w-100";
		stgSpells.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">Level 1 Spells & Cantrips</div>
			<div class="ve-flex-col" id="class-spells-container">
				<div class="ve-italic ve-muted">Select a class to see spell options...</div>
			</div>
		`;

		const dispSpells = document.createElement("div");
		dispSpells.className = "ve-flex-col";

		const hkClass = async () => {
			const classData = this._parent.class;
			if (!classData) {
				stgSpells.style.display = "none";
				return;
			}

			stgSpells.style.display = "";
			
			const spellsData = this._parseClassSpells(classData);
			const spellsHtml = await this._renderSpellsSelection(spellsData);
			const container = stgSpells.querySelector("#class-spells-container");
			if (container) container.innerHTML = spellsHtml;
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		const currentClass = this._parent.class;
		if (!currentClass) {
			stgSpells.style.display = "none";
		}

		return {
			stgSpells,
			dispSpells,
		};
	}

	_parseClassSpells (classData) {
		// Always return a valid structure for the modal system to work
		// The modal system will handle filtering spells by class
		return {
			spells: [],
			cantrips: []
		};
	}

	async _renderSpellsSelection (spellsData) {
		if (!spellsData) {
			return `<div class="ve-italic ve-muted">No spellcasting available for this class.</div>`;
		}

		const classData = this._parent.class;
		const className = classData.name;
		
		// Get spell limits based on class
		const spellLimits = this._getClassSpellLimits(className);
		
		let html = '<div class="ve-flex-col">';
		
		// Add spell counters with proper limits display
		html += '<div class="ve-flex ve-mb-2">';
		html += `<div class="ve-mr-3"><span class="ve-bold">Cantrips:</span> <span id="cantrip-count">0/${spellLimits.cantrips}</span></div>`;
		const spellLimitDisplay = spellLimits.isPreparedSpells ? "0/?" : `0/${spellLimits.spells}`;
		html += `<div><span class="ve-bold">Level 1 Spells:</span> <span id="spell-count">${spellLimitDisplay}</span></div>`;
		html += '</div>';

		// Add spell selection buttons (following same pattern as class filter)
		html += '<div class="ve-flex ve-mb-2">';
		html += `<button class="ve-btn ve-btn-xs ve-btn-default ve-br-0 ve-pr-2" id="select-cantrips-btn" title="Filter for Cantrips"><span class="glyphicon glyphicon-filter"></span> Select Cantrips</button>`;
		html += `<button class="ve-btn ve-btn-xs ve-btn-default ve-br-0 ve-pr-2" id="select-spells-btn" title="Filter for Level 1 Spells"><span class="glyphicon glyphicon-filter"></span> Select Level 1 Spells</button>`;
		html += '</div>';

		// Add selected spells display
		html += '<div class="ve-flex-col">';
		html += '<div class="ve-bold ve-mb-1">Selected Cantrips:</div>';
		html += '<div class="ve-flex ve-flex-wrap ve-mb-2" id="selected-cantrips">';
		html += '<div class="ve-italic ve-muted">No cantrips selected</div>';
		html += '</div>';
		
		html += '<div class="ve-bold ve-mb-1">Selected Level 1 Spells:</div>';
		html += '<div class="ve-flex ve-flex-wrap" id="selected-spells">';
		html += '<div class="ve-italic ve-muted">No spells selected</div>';
		html += '</div>';
		html += '</div>';

		html += '</div>';

		// Initialize modal functionality after DOM is ready
		setTimeout(() => {
			this._initializeSpellModals(spellLimits);
			
			// Add hook to update spell counters when ability scores change
			if (spellLimits.isPreparedSpells) {
				this._parent.addHookAbilityScores(() => {
					this._updateSpellCounters();
				});
				
				// Also add periodic updates as a fallback
				this._spellCounterInterval = setInterval(() => {
					this._updateSpellCounters();
				}, 1000);
			}
		}, 100);

		return html;
	}

	_getClassSpellLimits (className) {
		const classData = this._parent.class;
		if (!classData) return { cantrips: 0, spells: 0 };

		// Get cantrips from cantripProgression array (index 0 = level 1)
		const cantrips = classData.cantripProgression ? classData.cantripProgression[0] : 0;

		// Get spells known based on spellcasting system
		let spells = 0;
		let isPreparedSpells = false;
		let spellFormula = null;
		
		if (classData.spellsKnownProgressionFixed) {
			// Wizard uses spellsKnownProgressionFixed
			spells = classData.spellsKnownProgressionFixed[0] || 0;
		} else if (classData.spellsKnownProgression) {
			// Sorcerer, Warlock, Bard use spellsKnownProgression
			spells = classData.spellsKnownProgression[0] || 0;
		} else if (classData.preparedSpells) {
			// Cleric, Druid, Artificer prepare spells using formulas
			isPreparedSpells = true;
			spellFormula = classData.preparedSpells;
			spells = 0; // No fixed spells known, calculated dynamically
		}

		return { cantrips, spells, isPreparedSpells, spellFormula };
	}

	_getSpellcastingAbilityScore (className) {
		const classData = this._parent.class;
		if (!classData?.spellcastingAbility) return null;

		const abilityAbbr = classData.spellcastingAbility.toUpperCase();
		const abilityProp = `common_export_${abilityAbbr.toLowerCase()}`;
		
		// Check if ability score is determined
		const abilityScore = this._parent._state[abilityProp];
		
		if (abilityScore === undefined || abilityScore === null) return null;
		
		return abilityScore;
	}

	async _initializeSpellModals (spellLimits) {
		const classData = this._parent.class;
		const className = classData.name;

		// Initialize state for selected spells
		const cantripProp = `common_selectedCantrips_${className}`;
		const spellProp = `common_selectedSpells_${className}`;
		
		if (!this._parent._state[cantripProp]) {
			this._parent._state[cantripProp] = [];
		}
		if (!this._parent._state[spellProp]) {
			this._parent._state[spellProp] = [];
		}

		// Initialize spell modal filters dynamically based on current class
		if (this._parent._modalFilterCantrips && this._parent._modalFilterCantrips.pageFilter && this._parent._modalFilterCantrips.pageFilter.filterBox) {
			this._parent._modalFilterCantrips.pageFilter.filterBox.off(FILTER_BOX_EVNT_VALCHANGE);
		}
		if (this._parent._modalFilterSpells && this._parent._modalFilterSpells.pageFilter && this._parent._modalFilterSpells.pageFilter.filterBox) {
			this._parent._modalFilterSpells.pageFilter.filterBox.off(FILTER_BOX_EVNT_VALCHANGE);
		}

		// Load all spells like spells.js does - let filter system handle filtering
		const allSpells = await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_SPELLS);
		allSpells.forEach(spell => DataUtil.spell._mutEntity(spell));
		
		// Mutate spells for filtering - handle case where PageFilterSpells might not be loaded yet
		try {
			if (PageFilterSpells && PageFilterSpells.mutateForFilters) {
				allSpells.forEach(spell => PageFilterSpells.mutateForFilters(spell));
			}
		} catch (e) {
			console.warn("PageFilterSpells not available, skipping spell mutation:", e);
		}
		
		// Create cantrip modal filter with ALL spells (no pre-filtering)
		this._parent._modalFilterCantrips = new ModalFilterSpells({
			isRadio: false,
			namespace: `charactercreator_${className}_cantrips`,
			allData: allSpells,
		});

		// Create spell modal filter with ALL spells (no pre-filtering)
		this._parent._modalFilterSpells = new ModalFilterSpells({
			isRadio: false,
			namespace: `charactercreator_${className}_spells`,
			allData: allSpells,
		});

		// Initialize filter caches to make pills interactive
		await this._parent._modalFilterCantrips.pPopulateHiddenWrapper();
		await this._parent._modalFilterSpells.pPopulateHiddenWrapper();

		// Set up filter change handlers
		const doApplyCantripFilter = () => {
			const cantripCountEl = document.querySelector("#cantrip-count");
			if (cantripCountEl) {
				// Get currently selected cantrips from state
				const currentCantrips = this._parent._state[cantripProp] || [];
				cantripCountEl.textContent = `${currentCantrips.length}/${spellLimits.cantrips}`;
			}
		};

		const doApplySpellFilter = () => {
			const spellCountEl = document.querySelector("#spell-count");
			if (spellCountEl) {
				// Get currently selected spells from state
				const currentSpells = this._parent._state[spellProp] || [];
				if (spellLimits.isPreparedSpells) {
					const abilityScore = this._getSpellcastingAbilityScore(className);
					if (abilityScore !== null) {
						const modifier = Parser.getAbilityModifier(abilityScore);
						const maxSpells = this._calculatePreparedSpells(spellLimits.spellFormula, 1, modifier);
						spellCountEl.textContent = `${currentSpells.length}/${maxSpells}`;
					} else {
						spellCountEl.textContent = `${currentSpells.length}/?`;
					}
				} else {
					spellCountEl.textContent = `${currentSpells.length}/${spellLimits.spells}`;
				}
			}
		};

		// Get modal buttons and set up click handlers following same pattern as class filter
		const cantripBtn = document.querySelector("#select-cantrips-btn");
		const spellBtn = document.querySelector("#select-spells-btn");

		if (cantripBtn) {
			cantripBtn.addEventListener("click", async () => {
				const selected = await this._parent._modalFilterCantrips.pGetUserSelection({
					filterExpression: `class=${className.toLowerCase()}|level=0`
				});
				if (selected == null || !selected.length) return;

				this._parent._state[cantripProp] = selected.map(item => item.values.hash);
				await this._updateSelectedSpellsDisplay("cantrips", this._parent._state[cantripProp]);
				doApplyCantripFilter();
			});
		}

		if (spellBtn) {
			spellBtn.addEventListener("click", async () => {
				// Check if ability scores are determined for prepared spell classes
				if (spellLimits.isPreparedSpells) {
					const abilityScore = this._getSpellcastingAbilityScore(className);
					if (abilityScore === null) {
						// Show message to complete ability scores first
						const abilityName = classData.spellcastingAbility.toUpperCase();
						JqueryUtil.doToast({
							type: "info",
							content: `Please complete your ability scores first, then return here to select spells. Your ${abilityName} score determines how many spells you can prepare.`,
							autoHideTime: 8000
						});
						return;
					}
				}

				const selected = await this._parent._modalFilterSpells.pGetUserSelection({
					filterExpression: `class=${className.toLowerCase()}|level=1`
				});
				if (selected == null || !selected.length) return;

				this._parent._state[spellProp] = selected.map(item => item.values.hash);
				await this._updateSelectedSpellsDisplay("spells", this._parent._state[spellProp]);
				doApplySpellFilter();
			});
		}

		// Initialize displays
		await this._updateSelectedSpellsDisplay("cantrips", this._parent._state[cantripProp] || []);
		await this._updateSelectedSpellsDisplay("spells", this._parent._state[spellProp] || []);
		doApplyCantripFilter();
		doApplySpellFilter();
	}

	async _updateSelectedSpellsDisplay (type, selectedSpells) {
		const containerId = type === "cantrips" ? "selected-cantrips" : "selected-spells";
		const container = document.querySelector(`#${containerId}`);
		
		if (!container) return;

		if (!selectedSpells || selectedSpells.length === 0) {
			container.innerHTML = `<div class="ve-italic ve-muted">No ${type} selected</div>`;
			return;
		}

		// Find spell data for all selected spells
		const spellPromises = selectedSpells.map(async spellHash => {
			const spell = await this._findSpellByHash(spellHash);
			if (!spell) return "";
			
			return `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-border ve-rounded ve-mb-1 ve-relative">
					<div class="ve-bold">${spell.name}</div>
					<button class="ve-btn ve-btn-xs ve-btn-default ve-ml-2" onclick="this.parentElement.remove(); window._charactercreatorLevelOneClass._updateSpellCounters('${type}')">×</button>
				</div>
			`;
		});

		const html = (await Promise.all(spellPromises)).filter(Boolean).join("");
		container.innerHTML = html;
	}

	
	_calculatePreparedSpells (formula, level, modifier) {
		// Parse and evaluate spell preparation formulas
		// Examples: "<$level$> + <$wis_mod$>" or "<$level$> / 2 + <$int_mod$>"
		
		let result = formula;
		
		// Replace level placeholder
		result = result.replace(/<\$level\$>/g, level);
		
		// Replace ability modifier placeholders
		const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
		result = result.replace(/<\$[a-z_]+mod\$>/g, modStr);
		
		// Evaluate expression safely
		try {
			// Handle specific formula patterns
			if (result.includes('/')) {
				// Handle division formulas like "1 / 2 + 3"
				const parts = result.split('+').map(p => p.trim());
				let total = 0;
				
				parts.forEach(part => {
					if (part.includes('/')) {
						const [num, denom] = part.split('/').map(p => p.trim());
						const division = parseFloat(num) / parseFloat(denom);
						total += division;
					} else {
						total += parseFloat(part) || 0;
					}
				});
				
				const calculated = Math.floor(total);
				// Ensure minimum of 1 spell for all prepared spellcasters at level 1
				const minimum = level === 1 ? 1 : 0;
				return Math.max(minimum, calculated);
			} else {
				// Handle simple addition formulas like "1 + 3"
				const parts = result.split('+').map(p => p.trim());
				const total = parts.reduce((sum, part) => sum + (parseFloat(part) || 0), 0);
				// Ensure minimum of 1 spell for all prepared spellcasters at level 1
				const minimum = level === 1 ? 1 : 0;
				return Math.max(minimum, total);
			}
		} catch (e) {
			console.warn("Failed to evaluate spell formula:", formula, e);
			return 0;
		}
	}

	async _findSpellByHash (hash) {
		try {
			// Load all spells to find the one matching the hash
			const allSpells = await DataLoader.pCacheAndGetAllSite(UrlUtil.PG_SPELLS);
			return allSpells.find(spell => UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](spell) === hash);
		} catch (e) {
			console.warn("Failed to find spell by hash:", hash, e);
			return null;
		}
	}

	_getPtsEquipment () {
		const stgEquipment = document.createElement("div");
		stgEquipment.className = "ve-flex-col ve-w-100";
		stgEquipment.innerHTML = `
			<div class="ve-mb-1 ve-bold ve-text-large">Starting Equipment</div>
			<div class="ve-flex-col" id="class-equipment-container">
				<div class="ve-italic ve-muted">Select a class to see equipment options...</div>
			</div>
		`;

		const dispEquipment = document.createElement("div");
		dispEquipment.className = "ve-flex-col";

		const hkClass = () => {
			const classData = this._parent.class;
			if (!classData) {
				stgEquipment.style.display = "none";
				return;
			}

			stgEquipment.style.display = "";
			
			const equipmentData = this._parseClassEquipment(classData);
			const equipmentHtml = this._renderEquipmentSelection(equipmentData);
			const container = stgEquipment.querySelector("#class-equipment-container");
			if (container) container.innerHTML = equipmentHtml;
		};
		this._parent._addHookBase("common_ixClass", hkClass);
		
		const currentClass = this._parent.class;
		if (!currentClass) {
			stgEquipment.style.display = "none";
		}

		return {
			stgEquipment,
			dispEquipment,
		};
	}

	_parseClassEquipment (classData) {
		if (!classData.startingEquipment || !classData.startingEquipment.length) {
			return null;
		}

		return {
			equipment: classData.startingEquipment.map(item => ({
				name: item,
				selected: false
			}))
		};
	}

	_renderEquipmentSelection (equipmentData) {
		if (!equipmentData || !equipmentData.equipment.length) {
			return `<div class="ve-italic ve-muted">No starting equipment available.</div>`;
		}

		return `<div class="ve-flex-col">
			${equipmentData.equipment.map(item => `
				<div class="ve-flex-v-center ve-py-1 ve-px-2 ve-clickable ve-border ve-rounded ve-mb-1">
					<div class="ve-bold">${item.name}</div>
				</div>
			`).join('')}
		</div>`;
	}

	async _generateSubclassPreviews (className, subclassOptions) {
		const previewElements = [];
		console.log(`Generating previews for ${className} with ${subclassOptions.length} options`);
		
		// Add a simple test preview first
		previewElements.push(`
			<div data-subclass-id="test_preview" class="ve-flex-col ve-mb-2 ve-hidden">
				<div class="ve-mb-1 ve-bold ve-text-large">Test Preview</div>
				<div class="ve-flex-col cls__feature-subclass">
					<p>This is a test preview to verify the toggle mechanism is working.</p>
					<p>If you can see this, the toggle system works but there's an issue with loading actual subclass data.</p>
				</div>
			</div>
		`);
		
		for (const option of subclassOptions) {
			try {
				console.log(`Loading subclass data for ${option.name} (${option.shortName}) from ${option.source}`);
				const subclassData = await this._loadSubclassData(className, option.shortName, option.source);
				if (subclassData) {
					console.log(`Successfully loaded ${option.name}, rendering content...`);
					const stateKey = `subclass_${className}_${option.shortName}_${option.source}`;
					
					// Render the subclass content like the classes page
					const renderedContent = this._renderSubclassContent(subclassData);
					console.log(`Rendered content for ${option.name}:`, renderedContent.substring(0, 100) + '...');
					
					previewElements.push(`
						<div data-subclass-id="${stateKey}" class="ve-flex-col ve-mb-2 ve-hidden">
							<div class="ve-mb-1 ve-bold ve-text-large">${option.name}</div>
							<div class="ve-flex-col cls__feature-subclass">
								${renderedContent}
							</div>
						</div>
					`);
				} else {
					console.warn(`No subclass data returned for ${option.name}`);
					// Add a fallback preview
					const stateKey = `subclass_${className}_${option.shortName}_${option.source}`;
					previewElements.push(`
						<div data-subclass-id="${stateKey}" class="ve-flex-col ve-mb-2 ve-hidden">
							<div class="ve-mb-1 ve-bold ve-text-large">${option.name}</div>
							<div class="ve-flex-col cls__feature-subclass">
								<div class="ve-italic ve-muted">Preview data not available for ${option.name} from ${option.source}.</div>
							</div>
						</div>
					`);
				}
			} catch (e) {
				console.error(`Failed to generate preview for ${option.name}:`, e);
			}
		}
		
		console.log(`Generated ${previewElements.length} preview elements`);
		return previewElements.join('');
	}

	_renderSubclassContent (subclassData) {
		if (!subclassData.subclassFeatures || !subclassData.subclassFeatures.length) {
			return '<div class="ve-italic ve-muted">No subclass features available.</div>';
		}

		// Render the first level of subclass features
		const firstLevelFeatures = subclassData.subclassFeatures[0] || [];
		if (!firstLevelFeatures.length) {
			return '<div class="ve-italic ve-muted">No level 1 subclass features available.</div>';
		}

		return firstLevelFeatures.map(feature => {
			if (typeof feature === 'string') {
				return `<p>${feature}</p>`;
			} else if (feature.entries) {
				return Renderer.get().render({entries: feature.entries});
			} else {
				return Renderer.get().render({entries: [feature]});
			}
		}).join('');
	}

	async _loadSubclassData (className, shortName, source) {
		try {
			// Use the same approach as classes.html - load subclass data directly
			const classData = this._parent.class;
			const fauxSc = {shortName, source, classSource: classData?.source || "PHB", className: className};
			const hash = UrlUtil.URL_TO_HASH_BUILDER["subclass"](fauxSc);
			
			const loaded = await DataLoader.pCacheAndGet("subclass", source, hash, {isSilent: true});
			if (!loaded) {
				console.warn(`No subclass data found for ${className}/${shortName} from ${source}`);
				return null;
			}

			// Debug: Show the actual subclass structure
			if (className === "Cleric" && shortName === "Knowledge") {
				console.log("Loaded subclass data:", loaded);
				console.log("Looking for:", { shortName, source });
			}

			console.log(`Found subclass: ${loaded.name} from ${loaded.source}`);

			// Create a complete subclass object for preview
			return {
				name: loaded.name,
				shortName: loaded.shortName,
				source: loaded.source,
				subclassFeatures: loaded.subclassFeatures || []
			};
		} catch (e) {
			console.error(`Error loading subclass data for ${className}/${shortName}:`, e);
			return null;
		}
	}

	_getPtsProficiencies () {
		const stgProficiencies = document.createElement("div");
		const dispProficiencies = document.createElement("div");

		const hkRenderProficiencies = () => {
			const classData = this._parent.class;
			if (!classData) {
				dispProficiencies.innerHTML = `<div class="ve-italic ve-muted">Select a class to view proficiencies.</div>`;
				stgProficiencies.style.display = "none";
				return;
			}

			stgProficiencies.style.display = "";
			
			const proficiencies = classData.startingProficiencies || {};
			const parts = [];

			// Armor proficiencies
			if (proficiencies.armor && proficiencies.armor.length) {
				const armorList = proficiencies.armor.map(armor => {
					if (typeof armor === "string") {
						return Renderer.get().render(armor);
					}
					return Renderer.get().render(armor);
				}).join(", ");
				parts.push(`<div><strong>Armor:</strong> ${armorList}</div>`);
			}

			// Weapon proficiencies
			if (proficiencies.weapons && proficiencies.weapons.length) {
				const weaponList = proficiencies.weapons.map(weapon => {
					if (typeof weapon === "string") {
						return Renderer.get().render(weapon);
					}
					return Renderer.get().render(weapon);
				}).join(", ");
				parts.push(`<div><strong>Weapons:</strong> ${weaponList}</div>`);
			}

			// Tool proficiencies
			const allTools = [...(proficiencies.tools || []), ...(proficiencies.toolProficiencies || [])];
			if (allTools.length > 0) {
				console.log("Processing all tools:", allTools);
				const fixedTools = [];
				const toolChoices = [];
				
				allTools.forEach(tool => {
					console.log("Processing tool:", tool, "Type:", typeof tool);
					if (typeof tool === "string") {
						// Check if this string contains a choice pattern
						if (tool.includes("of your choice") || tool.includes("of your choice")) {
							console.log("Found string-based tool choice:", tool);
							
							// Extract tool type and count
							let toolType = "";
							let count = 1;
							
							// Extract count - handle both digits and words
							let countMatch = tool.match(/(\d+)\s+.*?\s+of your choice/i);
							if (!countMatch) {
								// Try word-based count
								countMatch = tool.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s+.*?\s+of your choice/i);
							}
							console.log("Count match for tool:", tool, "Match:", countMatch);
							if (countMatch) {
								const countWord = countMatch[1].toLowerCase();
								const wordToNumber = {
									'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
									'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
								};
								count = wordToNumber[countWord] || parseInt(countMatch[1]) || 1;
								console.log("Parsed count:", count);
							} else {
								console.log("No count match found, using default 1");
							}
							
							// Extract tool type from {@item ...} references
							const itemMatch = tool.match(/\{@item ([^|]+)\|[^}]+\}/i);
							if (itemMatch) {
								toolType = itemMatch[1].toLowerCase();
							}
							
							// Get appropriate tool list based on type
							let toolOptions = [];
							if (toolType.includes("musical instrument")) {
								// Bard: exactly 3 instruments
								toolOptions = [
									"Bagpipes", "Drum", "Dulcimer", "Flute", "Glaur", "Hand Drum", 
									"Longhorn", "Lute", "Lyre", "Pan Flute", "Shawm", "Viol", "Yarting"
								];
							} else if (toolType.includes("artisan's tools") || toolType.includes("artisan tools")) {
								// Monk: 1 tool from artisan's tools OR musical instruments
								// Messenger/Tamer: any 1 tool
								toolOptions = [
									"Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", 
									"Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", 
									"Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", 
									"Mason's Tools", "Painter's Supplies", "Potter's Tools", 
									"Smith's Tools", "Tinker's Tools", "Weaver's Tools", 
									"Woodcarver's Tools",
									// Add musical instruments for Monk
									"Bagpipes", "Drum", "Dulcimer", "Flute", "Glaur", "Hand Drum", 
									"Longhorn", "Lute", "Lyre", "Pan Flute", "Shawm", "Viol", "Yarting"
								];
							} else if (toolType.includes("gaming set")) {
								toolOptions = [
									"Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set"
								];
							}
							
							if (toolOptions.length > 0) {
								toolChoices.push({
									choose: {
										count: count,
										from: toolOptions
									}
								});
							} else {
								// If we can't parse the type, treat as fixed tool
								fixedTools.push(Renderer.get().render(tool));
							}
						} else {
							// Regular fixed tool
							fixedTools.push(Renderer.get().render(tool));
						}
					} else if (tool.choose) {
						toolChoices.push(tool);
					} else {
						console.log("Found tool object (not string or choice):", tool);
					}
				});

				// Display fixed tools
				if (fixedTools.length > 0) {
					parts.push(`<div><strong>Tools:</strong> ${fixedTools.join(", ")}</div>`);
				}

				// Add tool selection if there are choices
				console.log("Tool choices found:", toolChoices.length);
				if (toolChoices.length > 0) {
					console.log("Adding tool selection HTML...");
					const toolSelectionHtml = this._renderToolSelection(toolChoices);
					parts.push(toolSelectionHtml);
				} else {
					console.log("No tool choices to display");
				}
			}

			// Saving throws (from proficiency array)
			if (classData.proficiency && classData.proficiency.length) {
				const savingThrows = classData.proficiency.map(abil => Parser.attAbvToFull(abil)).join(", ");
				parts.push(`<div><strong>Saving Throws:</strong> ${savingThrows}</div>`);
			}

			// Skills - check if there are choices to be made
			const skillChoices = [];
			const fixedSkills = [];
			
			if (proficiencies.skills && proficiencies.skills.length) {
				proficiencies.skills.forEach(skill => {
					if (typeof skill === "string") {
						fixedSkills.push(skill.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
					} else if (skill.choose) {
						skillChoices.push(skill);
					}
				});
			}

			// Display fixed skills
			if (fixedSkills.length > 0) {
				parts.push(`<div><strong>Skills:</strong> ${fixedSkills.join(", ")}</div>`);
			}

			if (parts.length === 0) {
				dispProficiencies.innerHTML = `<div class="ve-italic ve-muted">No proficiencies available.</div>`;
			} else {
				const basicHtml = `<div class="ve-flex-col ve-p-2 ve-border ve-rounded ve-bg-gray-100">${parts.join("")}</div>`;
				
				// Add skill selection if there are choices
				if (skillChoices.length > 0) {
					const skillSelectionHtml = this._renderSkillSelection(skillChoices);
					dispProficiencies.innerHTML = basicHtml + skillSelectionHtml;
				} else {
					dispProficiencies.innerHTML = basicHtml;
				}
			}
		};

		// Add hook with delay to avoid conflicts with class selection
		setTimeout(() => {
			this._parent._addHookBase("common_ixClass", hkRenderProficiencies);
			hkRenderProficiencies();
		}, 100);

		stgProficiencies.innerHTML = `<div class="ve-mb-1 ve-bold ve-text-large">Class Proficiencies</div>`;
		stgProficiencies.appendChild(dispProficiencies);

		return {stgProficiencies, dispProficiencies};
	}

	_renderSkillSelection (skillChoices) {
		let html = "";
		
		skillChoices.forEach((skillChoice, index) => {
			const count = skillChoice.choose.count || 1;
			const availableSkills = skillChoice.choose.from || [];
			
			// Create unique container ID for this skill selection
			const containerId = `skill-selection-${Date.now()}-${index}`;
			
			html += `<div class="ve-mb-3">
				<div class="ve-bold ve-mb-1">Choose ${count} ${count === 1 ? 'skill' : 'skills'}:</div>
				<div class="ve-flex" id="${containerId}">`;

			// Create separate dropdowns for each skill choice
			for (let i = 0; i < count; i++) {
				html += `
					<div class="ve-flex-v-center ve-mb-2 ve-mr-2">
						<div class="ve-flex-v-center ve-btn-group skill-selector-container-${i}" style="min-width: fit-content;">
							<!-- Skill selector will be inserted here -->
						</div>
					</div>`;
			}

			html += `</div>
			</div>`;

			// Add JavaScript for handling skill selection with separate dropdowns
			setTimeout(() => {
				// Store setFnFilter references for each dropdown
				const setFnFilters = {};
				
				// Get skill data (shared across all dropdowns)
				const skillData = availableSkills.map(skill => ({
					name: skill.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
					original: skill
				}));
				
				for (let i = 0; i < count; i++) {
					const container = document.querySelector(`#${containerId} .skill-selector-container-${i}`);
					
					if (container) {
						// Create skill selector using existing pattern
						const skillProp = `common_selectedSkills_${containerId}_${i}`;
						
						// Initialize state for skill selection
						if (!this._parent._state[skillProp]) {
							this._parent._state[skillProp] = null;
						}
						
						const {wrp: selSkill, setFnFilter: setFnFilterSkill} = ComponentUiUtil.getSelSearchable(
							this._parent,
							skillProp,
							{
								values: skillData.map((_, ix) => ix),
								isAllowNull: true,
								fnDisplay: ix => {
									const skill = skillData[ix];
									if (!skill) return "(Unknown)";
									return skill.name;
								},
								asMeta: true,
							},
						);
						
						container.innerHTML = "";
						container.appendChild(selSkill);
						
						// Store setFnFilter for this dropdown
						setFnFilters[i] = setFnFilterSkill;
						
						// Add filter functionality
						const doApplyFilterToSelSkill = () => {
							setFnFilterSkill(() => true);
						};
						
						doApplyFilterToSelSkill();
						
						// Update filters when any skill selection changes to remove duplicates
						this._parent._addHookBase(skillProp, () => {
							// Update all dropdowns to remove duplicates
							for (let j = 0; j < count; j++) {
								const currentSkillProp = `common_selectedSkills_${containerId}_${j}`;
								const currentSelected = this._parent._state[currentSkillProp];
								
								// Update filter for this dropdown
								if (setFnFilters[j]) {
									setFnFilters[j](ix => {
										if (ix == null) return true; // Allow null selection
										
										const currentSkillName = skillData[ix].original;
										
										// Check if this skill is selected in any other dropdown
										for (let k = 0; k < count; k++) {
											if (k !== j) {
												const otherProp = `common_selectedSkills_${containerId}_${k}`;
												const otherSel = this._parent._state[otherProp];
												if (otherSel != null && skillData[otherSel].original === currentSkillName) {
													return false;
												}
											}
										}
										
										return true;
									});
								}
							}
						});
					}
				}
			}, 100);
		});
		
		return html;
	}

	_renderToolSelection (toolChoices) {
		let html = "";
		
		toolChoices.forEach((toolChoice, index) => {
			const count = toolChoice.choose.count || 1;
			const availableTools = toolChoice.choose.from || [];
			
			// Create unique container ID for this tool selection
			const containerId = `tool-selection-${Date.now()}-${index}`;
			
			html += `<div class="ve-mb-3">
				<div class="ve-bold ve-mb-1">Choose ${count} ${count === 1 ? 'tool' : 'tools'}:</div>
				<div class="ve-flex" id="${containerId}">`;

			// Create separate dropdowns for each tool choice
			for (let i = 0; i < count; i++) {
				html += `
					<div class="ve-flex-v-center ve-mb-2 ve-mr-2">
						<div class="ve-flex-v-center ve-btn-group skill-selector-container-${i}" style="min-width: fit-content;">
							<!-- Tool selector will be inserted here -->
						</div>
					</div>`;
			}

			html += `</div>
			</div>`;

			// Add JavaScript for handling tool selection with separate dropdowns
			setTimeout(() => {
				// Store setFnFilter references for each dropdown
				const setFnFilters = {};
				
				// Get tool data (shared across all dropdowns)
				const toolData = availableTools.map(tool => ({
					name: typeof tool === "string" ? tool : tool.name || tool,
					original: typeof tool === "string" ? tool : tool.name || tool
				}));
				
				for (let i = 0; i < count; i++) {
					const container = document.querySelector(`#${containerId} .skill-selector-container-${i}`);
					
					if (container) {
						// Create tool selector using existing pattern
						const toolProp = `common_selectedTools_${containerId}_${i}`;
						
						// Initialize state for tool selection
						if (!this._parent._state[toolProp]) {
							this._parent._state[toolProp] = null;
						}
						
						const {wrp: selTool, setFnFilter: setFnFilterTool} = ComponentUiUtil.getSelSearchable(
							this._parent,
							toolProp,
							{
								values: toolData.map((_, ix) => ix),
								isAllowNull: true,
								fnDisplay: ix => {
									const tool = toolData[ix];
									if (!tool) return "(Unknown)";
									return tool.name;
								},
								asMeta: true,
							},
						);
						
						container.innerHTML = "";
						container.appendChild(selTool);
						
						// Store setFnFilter for this dropdown
						setFnFilters[i] = setFnFilterTool;
						
						// Add filter functionality
						const doApplyFilterToSelTool = () => {
							setFnFilterTool(() => true);
						};
						
						doApplyFilterToSelTool();
						
						// Update filters when any tool selection changes to remove duplicates
						this._parent._addHookBase(toolProp, () => {
							// Update all dropdowns to remove duplicates
							for (let j = 0; j < count; j++) {
								const currentToolProp = `common_selectedTools_${containerId}_${j}`;
								const currentSelected = this._parent._state[currentToolProp];
								
								// Update filter for this dropdown
								if (setFnFilters[j]) {
									setFnFilters[j](ix => {
										if (ix == null) return true; // Allow null selection
										
										const currentToolName = toolData[ix].original;
										
										// Check if this tool is selected in any other dropdown
										for (let k = 0; k < count; k++) {
											if (k !== j) {
												const otherProp = `common_selectedTools_${containerId}_${k}`;
												const otherSel = this._parent._state[otherProp];
												if (otherSel != null && toolData[otherSel].original === currentToolName) {
													return false;
												}
											}
										}
										
										return true;
									});
								}
							}
						});
					}
				}
			}, 100);
		});
		
		return html;
	}
}
