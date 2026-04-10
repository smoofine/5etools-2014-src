import {StatGenUiRenderLevelOneEntityBase} from "./charactercreator-ui-comp-levelone-entitybase.js";

export class StatGenUiRenderLevelOneRace extends StatGenUiRenderLevelOneEntityBase {
	_title = "Race";
	_titleShort = "Race";
	_propIxEntity = "common_ixRace";
	_propIxAbilityScoreSet = "common_ixAbilityScoreSetRace";
	_propData = "_races";
	_propModalFilter = "_modalFilterRaces";
	_propIsPreview = "common_isPreviewRace";
	_propEntity = "race";
	_page = UrlUtil.PG_RACES;
	_propChoiceMetasFrom = "common_raceChoiceMetasFrom";
	_propChoiceWeighted = "common_raceChoiceMetasWeighted";

	render () {
		const out = super.render();

		const {stgTashasControls, dispTashas} = this._getPtsTashas();

		out.stgSel.appends(stgTashasControls);

		out.dispTashas = dispTashas;

		// Add language selection
		const {stgLanguages, dispLanguages} = this._getPtsLanguages();
		out.stgSel.appends(stgLanguages);
		out.dispLanguages = dispLanguages;

		// Add race features display
		const {stgRaceFeatures, dispRaceFeatures} = this._getPtsRaceFeatures();
		out.stgSel.appends(stgRaceFeatures);
		out.dispRaceFeatures = dispRaceFeatures;

		// Add divider from base class
		out.divider = out.divider;

		return out;
	}

	_pb_getAbilityList () {
		return this._parent._pb_getRaceAbilityList();
	}

	_pb_getAbility () {
		return this._parent._pb_getRaceAbility();
	}

	_bindAdditionalHooks_hkIxEntity (hkIxEntity) {
		this._parent._addHookBase("common_isTashas", hkIxEntity);
	}

	_bindAdditionalHooks_hkSetValuesSelAbilitySet (hkSetValuesSelAbilitySet) {
		this._parent._addHookBase("common_isTashas", hkSetValuesSelAbilitySet);
	}

	_getHrPreviewMeta () {
		const out = super._getHrPreviewMeta();
		const {hkPreview} = out;
		this._parent._addHookBase("common_isShowTashasRules", hkPreview);
		return out;
	}

	_getHkPreview ({hrPreview}) {
		return () => hrPreview.toggleVe(this._parent._state[this._propIsPreview] && this._parent._state.common_isShowTashasRules && this._parent._state.common_isAllowTashasRules);
	}

	_getPtsTashas () {
		const btnToggleTashasPin = ComponentUiUtil.getBtnBool(
			this._parent,
			"common_isShowTashasRules",
			{
				html: `<button class="ve-btn ve-btn-xxs ve-btn-default ve-small ve-p-0 ve-statgen-shared__btn-toggle-tashas-rules ve-flex-vh-center" title="Toggle &quot;Customizing Your Origin&quot; Section"><span class="glyphicon glyphicon-eye-open"></span></button>`,
			},
		);

		const stgTashasControls = ee`<div class="ve-flex-col ve-w-100">
			<label class="ve-flex-v-center ve-mb-1">
				<div class="ve-mr-2">Allow Origin Customization</div>
				${ComponentUiUtil.getCbBool(this._parent, "common_isTashas")}
			</label>

			<div class="ve-flex">
				<div class="ve-small ve-muted ve-italic ve-mr-1">${Renderer.get().render(`An {@variantrule Customizing Your Origin|TCE|optional rule}`)}</div>
				${btnToggleTashasPin}
				<div class="ve-small ve-muted ve-italic ve-ml-1">${Renderer.get().render(`from Tasha's Cauldron of Everything, page 8.`)}</div>
			</div>
		</div>`;
		this._parent._addHookBase("common_isAllowTashasRules", () => {
			stgTashasControls.toggleVe(this._parent._state.common_isAllowTashasRules);
		})();

		const dispTashas = ee`<div class="ve-flex-col"><div class="ve-italic ve-muted">Loading...</div></div>`;
		DataLoader.pCacheAndGet(UrlUtil.PG_VARIANTRULES, Parser.SRC_TCE, UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_VARIANTRULES]({name: "Customizing Your Origin", source: Parser.SRC_TCE}))
			.then(rule => {
				ee(dispTashas.empty())`${Renderer.hover.getHoverContent_stats(UrlUtil.PG_VARIANTRULES, rule)}<hr class="ve-hr-3">`;
			});
		const hkIsShowTashas = () => {
			dispTashas.toggleVe(this._parent._state.common_isShowTashasRules && this._parent._state.common_isAllowTashasRules);
		};
		this._parent._addHookBase("common_isShowTashasRules", hkIsShowTashas);
		hkIsShowTashas();

		return {
			stgTashasControls,
			dispTashas,
		};
	}

	_getPtsLanguages () {
		const stgLanguages = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Languages</div>
			<div class="ve-flex-col" id="race-languages-container">
				<div class="ve-italic ve-muted">Select a race to see language options...</div>
			</div>
		</div>`;

		const dispLanguages = ee`<div class="ve-flex-col"></div>`;

		// Hook to update language selection when race changes
		const hkRace = () => {
			const race = this._parent.race;
			if (!race) {
				stgLanguages.find("#race-languages-container").html(`<div class="ve-italic ve-muted">Select a race to see language options...</div>`);
				return;
			}

			const languageData = this._parseRaceLanguages(race);
			const languageHtml = this._renderLanguageSelection(languageData);
			stgLanguages.find("#race-languages-container").html(languageHtml);
		};
		this._parent._addHookBase("common_ixRace", hkRace);
		hkRace();

		return {
			stgLanguages,
			dispLanguages,
		};
	}

	_parseRaceLanguages (race) {
		const predetermined = [];
		let additionalCount = 0;
		let anyStandard = false;
		let anyExotic = false;

		// Parse languageProficiencies from race data
		if (race.languageProficiencies) {
			race.languageProficiencies.forEach(lp => {
				if (lp.common) predetermined.push("Common");
				if (lp.anyStandard) additionalCount = Math.max(additionalCount, lp.anyStandard);
				if (lp.anyExotic) additionalCount = Math.max(additionalCount, lp.anyExotic);
				if (lp.anyStandard) anyStandard = true;
				if (lp.anyExotic) anyExotic = true;
				
				// Add specific languages
				Object.keys(lp).forEach(lang => {
					if (lp[lang] === true && lang !== "common" && lang !== "anyStandard" && lang !== "anyExotic") {
						predetermined.push(lang);
					}
				});
			});
		}

		// Parse language information from entries text
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const langMatch = entry.match(/(?:speak, read, and write )([^.]*)/i);
					if (langMatch) {
						const langText = langMatch[1].toLowerCase();
						
						// Extract specific language names
						const languages = langText.split(",").map(lang => lang.trim().replace("and", "").trim());
						languages.forEach(lang => {
							if (lang && lang !== "common" && !lang.includes("other language")) {
								// Check if this language exists in our language data
								const languageExists = this._parent.languages.some(l => 
									l.name.toLowerCase() === lang.toLowerCase()
								);
								if (languageExists && !predetermined.includes(lang)) {
									predetermined.push(lang);
								}
							}
						});
						
						// Count additional languages
						if (langText.includes("one other language")) {
							additionalCount = Math.max(additionalCount, 1);
						}
						if (langText.includes("two other languages")) {
							additionalCount = Math.max(additionalCount, 2);
						}
						if (langText.includes("three other languages")) {
							additionalCount = Math.max(additionalCount, 3);
						}
					}
				} else if (entry.type === "entries" && entry.name === "Language" && entry.entries) {
					// Handle structured language entries
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const langMatch = subEntry.match(/(?:speak, read, and write )([^.]*)/i);
							if (langMatch) {
								const langText = langMatch[1].toLowerCase();
								
								// Extract specific language names
								const languages = langText.split(",").map(lang => lang.trim().replace("and", "").trim());
								languages.forEach(lang => {
									if (lang && lang !== "common" && !lang.includes("other language")) {
										// Check if this language exists in our language data
										const languageExists = this._parent.languages.some(l => 
											l.name.toLowerCase() === lang.toLowerCase()
										);
										if (languageExists && !predetermined.includes(lang)) {
											predetermined.push(lang);
										}
									}
								});
								
								// Count additional languages
								if (langText.includes("one other language")) {
									additionalCount = Math.max(additionalCount, 1);
								}
								if (langText.includes("two other languages")) {
									additionalCount = Math.max(additionalCount, 2);
								}
								if (langText.includes("three other languages")) {
									additionalCount = Math.max(additionalCount, 3);
								}
							}
						}
					});
				}
			});
		}

		return {
			predetermined,
			additionalCount,
			anyStandard,
			anyExotic,
		};
	}

	_renderLanguageSelection (languageData) {
		const { predetermined, additionalCount, anyStandard, anyExotic } = languageData;
		
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
			const availableLanguages = this._parent.languages.filter(lang => {
				// Filter out predetermined languages
				if (predetermined.includes(lang.name)) return false;
				
				// Filter based on language type restrictions
				if (anyStandard && !anyExotic) {
					return lang.type === "standard" || !lang.type; // Include standard and untyped languages
				}
				if (!anyStandard && anyExotic) {
					return lang.type === "exotic";
				}
				return true; // No restrictions
			});

			// Create unique container ID for this race selection
			const containerId = `language-selection-${Date.now()}`;
			
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Select ${additionalCount} additional ${additionalCount === 1 ? 'language' : 'languages'}:</div>
				<div class="ve-flex-col" id="${containerId}">
					<div class="ve-flex-v-center ve-mb-2">
						<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 language-selector-container">
							<!-- Language selector will be inserted here -->
						</div>
					</div>
					<div class="ve-small ve-muted ve-mt-1">
						<span id="language-count-${containerId}">0</span>/${additionalCount} languages selected
					</div>
				</div>
			</div>`;

			// Add JavaScript for handling language selection with dropdown
			setTimeout(() => {
				const container = document.querySelector(`#${containerId} .language-selector-container`);
				const countSpan = document.getElementById(`language-count-${containerId}`);
				
				if (container && countSpan) {
					// Create language selector using existing pattern
					const languageProp = `common_selectedLanguages_${containerId}`;
					
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
						// For now, show all languages since we already filtered them
						setFnFilterLanguage(() => true);
					};
					
					doApplyFilterToSelLanguage();
					
					// Update count when selection changes
					const updateCount = () => {
						const selected = this._parent._state[languageProp] || [];
						countSpan.textContent = selected.length;
						
						// Enforce limit
						if (selected.length > additionalCount) {
							// Remove excess selections
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
			html = `<div class="ve-italic ve-muted">No language options available for this race.</div>`;
		}

		return html;
	}

	_getPtsRaceFeatures () {
		const stgRaceFeatures = ee`<div class="ve-flex-col ve-w-100">
			<div class="ve-mb-1 ve-bold ve-text-large">Race Features</div>
			<div class="ve-flex-col" id="race-features-container">
				<div class="ve-italic ve-muted">Select a race to see features...</div>
			</div>
		</div>`;

		const dispRaceFeatures = ee`<div class="ve-flex-col"></div>`;

		// Hook to update race features when race changes
		const hkRace = () => {
			const race = this._parent.race;
			if (!race) {
				stgRaceFeatures.find("#race-features-container").html(`<div class="ve-italic ve-muted">Select a race to see features...</div>`);
				return;
			}

			const featuresHtml = this._renderRaceFeatures(race);
			stgRaceFeatures.find("#race-features-container").html(featuresHtml);
		};
		this._parent._addHookBase("common_ixRace", hkRace);
		hkRace();

		return {
			stgRaceFeatures,
			dispRaceFeatures,
		};
	}

	_renderRaceFeatures (race) {
		let html = "";

		// Base Speed
		const speedData = this._parseRaceSpeed(race);
		if (speedData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Base Speed:</div>
				<div class="ve-flex ve-flex-wrap">
					${speedData.map(speed => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${speed}</div>`
					).join("")}
				</div>
			</div>`;
		}

		// Special Senses
		const sensesData = this._parseRaceSenses(race);
		if (sensesData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Special Senses:</div>
				<div class="ve-flex ve-flex-wrap">
					${sensesData.map(sense => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${sense}</div>`
					).join("")}
				</div>
			</div>`;
		}

		// Weapon and Armor Proficiencies
		const weaponArmorData = this._parseRaceWeaponArmorProficiencies(race);
		if (weaponArmorData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Weapon & Armor Proficiencies:</div>
				${weaponArmorData.map(prof => 
					prof.isChoice ? prof.html : 
					`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${prof.text}</div>`
				).join("")}
			</div>`;
		}

		// Tool Proficiencies
		const toolData = this._parseRaceToolProficiencies(race);
		if (toolData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Tool Proficiencies:</div>
				${toolData.map(tool => 
					tool.isChoice ? tool.html : 
					`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${tool.text}</div>`
				).join("")}
			</div>`;
		}

		// Skill Proficiencies
		const skillData = this._parseRaceSkillProficiencies(race);
		if (skillData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Skill Proficiencies:</div>
				${skillData.map(skill => 
					skill.isChoice ? skill.html : 
					`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${skill.text}</div>`
				).join("")}
			</div>`;
		}

		// Damage Resistances, Immunities, and Vulnerabilities
		const resistanceData = this._parseRaceResistances(race);
		if (resistanceData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Damage Resistances & Immunities:</div>
				<div class="ve-flex ve-flex-wrap">
					${resistanceData.map(resistance => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${resistance}</div>`
					).join("")}
				</div>
			</div>`;
		}

		// Spells
		const spellData = this._parseRaceSpells(race);
		if (spellData.length > 0) {
			html += `<div class="ve-mb-2">
				<div class="ve-bold ve-mb-1">Spells:</div>
				<div class="ve-flex ve-flex-wrap">
					${spellData.map(spell => 
						`<div class="ve-border ve-p-1 ve-mr-1 ve-mb-1 ve-rounded ve-inline-block" style="border: 1px solid #555555; padding: 2px 6px; background: #222222; color: #777777; font-weight: normal;">${spell}</div>`
					).join("")}
				</div>
			</div>`;
		}

		if (html === "") {
			html = `<div class="ve-italic ve-muted">No special features available for this race.</div>`;
		}

		return html;
	}

	_parseRaceSpeed (race) {
		const speeds = [];
		
		if (race.speed) {
			if (typeof race.speed === "number") {
				speeds.push(`${race.speed} ft. walk`);
			} else if (typeof race.speed === "object") {
				if (race.speed.walk) speeds.push(`${race.speed.walk} ft. walk`);
				if (race.speed.fly) {
					const flySpeed = typeof race.speed.fly === "number" ? race.speed.fly : "equal to walk speed";
					speeds.push(`${flySpeed} ft. fly`);
				}
				if (race.speed.swim) speeds.push(`${race.speed.swim} ft. swim`);
				if (race.speed.climb) speeds.push(`${race.speed.climb} ft. climb`);
				if (race.speed.burrow) speeds.push(`${race.speed.burrow} ft. burrow`);
			}
		}

		// Check entries for speed information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const speedMatch = entry.match(/(\d+)-foot.*speed|speed.*(\d+)/i);
					if (speedMatch) {
						const speed = speedMatch[1] || speedMatch[2];
						if (!speeds.some(s => s.includes(speed))) {
							speeds.push(`${speed} ft.`);
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const speedMatch = subEntry.match(/(\d+)-foot.*speed|speed.*(\d+)/i);
							if (speedMatch) {
								const speed = speedMatch[1] || speedMatch[2];
								if (!speeds.some(s => s.includes(speed))) {
									speeds.push(`${speed} ft.`);
								}
							}
						}
					});
				}
			});
		}

		return speeds;
	}

	_parseRaceSenses (race) {
		const senses = [];

		// Darkvision
		if (race.darkvision) {
			senses.push(`Darkvision ${race.darkvision} ft.`);
		}

		// Check entries for other senses
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					// Look for blindsight, tremorsense, truesight
					const blindsightMatch = entry.match(/blindsight\s*(\d+)\s*ft/i);
					const tremorsenseMatch = entry.match(/tremorsense\s*(\d+)\s*ft/i);
					const truesightMatch = entry.match(/truesight\s*(\d+)\s*ft/i);

					if (blindsightMatch && !senses.some(s => s.includes("Blindsight"))) {
						senses.push(`Blindsight ${blindsightMatch[1]} ft.`);
					}
					if (tremorsenseMatch && !senses.some(s => s.includes("Tremorsense"))) {
						senses.push(`Tremorsense ${tremorsenseMatch[1]} ft.`);
					}
					if (truesightMatch && !senses.some(s => s.includes("Truesight"))) {
						senses.push(`Truesight ${truesightMatch[1]} ft.`);
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const blindsightMatch = subEntry.match(/blindsight\s*(\d+)\s*ft/i);
							const tremorsenseMatch = subEntry.match(/tremorsense\s*(\d+)\s*ft/i);
							const truesightMatch = subEntry.match(/truesight\s*(\d+)\s*ft/i);

							if (blindsightMatch && !senses.some(s => s.includes("Blindsight"))) {
								senses.push(`Blindsight ${blindsightMatch[1]} ft.`);
							}
							if (tremorsenseMatch && !senses.some(s => s.includes("Tremorsense"))) {
								senses.push(`Tremorsense ${tremorsenseMatch[1]} ft.`);
							}
							if (truesightMatch && !senses.some(s => s.includes("Truesight"))) {
								senses.push(`Truesight ${truesightMatch[1]} ft.`);
							}
						}
					});
				}
			});
		}

		return senses;
	}

	_parseRaceWeaponArmorProficiencies (race) {
		const proficiencies = [];

		// Check explicit proficiency arrays
		if (race.weaponProficiencies) {
			race.weaponProficiencies.forEach((wp, index) => {
				Object.keys(wp).forEach(weapon => {
					if (wp[weapon] === true && weapon !== "any" && weapon !== "choose") {
						proficiencies.push({ text: this._capitalizeFirst(weapon), isChoice: false });
					}
				});
				if (wp.any) proficiencies.push({ text: "Any weapons", isChoice: false });
				if (wp.choose) {
					const choiceData = this._createChoiceDropdown("weapon", index, wp.choose, "weapon");
					proficiencies.push({ text: "Choose weapons", isChoice: true, html: choiceData });
				}
			});
		}

		if (race.armorProficiencies) {
			race.armorProficiencies.forEach((ap, index) => {
				Object.keys(ap).forEach(armor => {
					if (ap[armor] === true && armor !== "any" && armor !== "choose") {
						proficiencies.push({ text: this._capitalizeFirst(armor), isChoice: false });
					}
				});
				if (ap.any) proficiencies.push({ text: "Any armor", isChoice: false });
				if (ap.choose) {
					const choiceData = this._createChoiceDropdown("armor", index, ap.choose, "armor");
					proficiencies.push({ text: "Choose armor", isChoice: true, html: choiceData });
				}
			});
		}

		// Check entries for proficiency information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const profMatch = entry.match(/proficient with ([^.]+)/i);
					if (profMatch) {
						const profText = profMatch[1].trim();
						if (!proficiencies.some(p => p.text && p.text.toLowerCase().includes(profText.toLowerCase()))) {
							proficiencies.push({ text: this._capitalizeFirst(profText), isChoice: false });
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const profMatch = subEntry.match(/proficient with ([^.]+)/i);
							if (profMatch) {
								const profText = profMatch[1].trim();
								if (!proficiencies.some(p => p.text && p.text.toLowerCase().includes(profText.toLowerCase()))) {
									proficiencies.push({ text: this._capitalizeFirst(profText), isChoice: false });
								}
							}
						}
					});
				}
			});
		}

		return proficiencies;
	}

	_parseRaceToolProficiencies (race) {
		const tools = [];

		// Check explicit tool proficiencies
		if (race.toolProficiencies) {
			race.toolProficiencies.forEach((tp, index) => {
				Object.keys(tp).forEach(tool => {
					if (tp[tool] === true && tool !== "any" && tool !== "choose") {
						tools.push({ text: this._capitalizeFirst(tool), isChoice: false });
					}
				});
				if (tp.any) tools.push({ text: "Any tools", isChoice: false });
				if (tp.choose) {
					const choiceData = this._createChoiceDropdown("tool", index, tp.choose, "tool");
					tools.push({ text: "Choose tools", isChoice: true, html: choiceData });
				}
			});
		}

		// Check entries for tool proficiency information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const toolMatch = entry.match(/proficient with ([^.]*tools?[^.]*)/i);
					if (toolMatch) {
						const toolText = toolMatch[1].trim();
						if (!tools.some(t => t.text && t.text.toLowerCase().includes(toolText.toLowerCase()))) {
							tools.push({ text: this._capitalizeFirst(toolText), isChoice: false });
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const toolMatch = subEntry.match(/proficient with ([^.]*tools?[^.]*)/i);
							if (toolMatch) {
								const toolText = toolMatch[1].trim();
								if (!tools.some(t => t.text && t.text.toLowerCase().includes(toolText.toLowerCase()))) {
									tools.push({ text: this._capitalizeFirst(toolText), isChoice: false });
								}
							}
						}
					});
				}
			});
		}

		return tools;
	}

	_parseRaceSkillProficiencies (race) {
		const skills = [];

		// Check explicit skill proficiencies
		if (race.skillProficiencies) {
			race.skillProficiencies.forEach((sp, index) => {
				Object.keys(sp).forEach(skill => {
					if (sp[skill] === true && skill !== "any" && skill !== "choose") {
						skills.push({ text: this._capitalizeFirst(skill), isChoice: false });
					}
				});
				if (sp.any) skills.push({ text: "Any skills", isChoice: false });
				if (sp.choose) {
					const choiceData = this._createChoiceDropdown("skill", index, sp.choose, "skill");
					skills.push({ text: "Choose skills", isChoice: true, html: choiceData });
				}
			});
		}

		// Check entries for skill proficiency information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const skillMatch = entry.match(/proficient in the ([^.]+) skill/i);
					if (skillMatch) {
						const skillText = skillMatch[1].trim();
						if (!skills.some(s => s.text && s.text.toLowerCase().includes(skillText.toLowerCase()))) {
							skills.push({ text: this._capitalizeFirst(skillText), isChoice: false });
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const skillMatch = subEntry.match(/proficient in the ([^.]+) skill/i);
							if (skillMatch) {
								const skillText = skillMatch[1].trim();
								if (!skills.some(s => s.text && s.text.toLowerCase().includes(skillText.toLowerCase()))) {
									skills.push({ text: this._capitalizeFirst(skillText), isChoice: false });
								}
							}
						}
					});
				}
			});
		}

		return skills;
	}

	_parseRaceSpells (race) {
		const spells = [];

		// Check additionalSpells
		if (race.additionalSpells) {
			race.additionalSpells.forEach(spellGroup => {
				if (spellGroup.innate) {
					Object.keys(spellGroup.innate).forEach(level => {
						const levelSpells = spellGroup.innate[level];
						if (Array.isArray(levelSpells)) {
							levelSpells.forEach(spell => {
								if (typeof spell === "string") {
									const spellName = spell.split("#")[0]; // Remove suffixes like #c for cantrip
									if (!spells.some(s => s.toLowerCase().includes(spellName.toLowerCase()))) {
										spells.push(this._capitalizeFirst(spellName) + " (innate)");
									}
								}
							});
						}
					});
				}
				if (spellGroup.known) {
					Object.keys(spellGroup.known).forEach(level => {
						const levelSpells = spellGroup.known[level];
						if (Array.isArray(levelSpells)) {
							levelSpells.forEach(spell => {
								if (typeof spell === "string") {
									const spellName = spell.split("#")[0];
									if (!spells.some(s => s.toLowerCase().includes(spellName.toLowerCase()))) {
										spells.push(this._capitalizeFirst(spellName));
									}
								}
							});
						}
					});
				}
			});
		}

		// Check entries for spell information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					const spellMatch = entry.match(/cast the ([^}]+) spell/i);
					if (spellMatch) {
						const spellText = spellMatch[1].trim();
						if (!spells.some(s => s.toLowerCase().includes(spellText.toLowerCase()))) {
							spells.push(this._capitalizeFirst(spellText));
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const spellMatch = subEntry.match(/cast the ([^}]+) spell/i);
							if (spellMatch) {
								const spellText = spellMatch[1].trim();
								if (!spells.some(s => s.toLowerCase().includes(spellText.toLowerCase()))) {
									spells.push(this._capitalizeFirst(spellText));
								}
							}
						}
					});
				}
			});
		}

		return spells;
	}

	_parseRaceResistances (race) {
		const resistances = [];

		// Check explicit resistance arrays
		if (race.resist) {
			race.resist.forEach(res => {
				resistances.push(`${this._capitalizeFirst(res)} Resistance`);
			});
		}

		if (race.immunity) {
			race.immunity.forEach(imm => {
				resistances.push(`${this._capitalizeFirst(imm)} Immunity`);
			});
		}

		if (race.vulnerable) {
			race.vulnerable.forEach(vuln => {
				resistances.push(`${this._capitalizeFirst(vuln)} Vulnerability`);
			});
		}

		// Check entries for resistance information
		if (race.entries) {
			race.entries.forEach(entry => {
				if (typeof entry === "string") {
					// Look for resistance patterns
					const resistMatch = entry.match(/resistance to ([^.]+)/i);
					const immuneMatch = entry.match(/immune to ([^.]+)/i);
					const vulnMatch = entry.match(/vulnerable to ([^.]+)/i);

					if (resistMatch) {
						const resistText = resistMatch[1].trim();
						if (!resistances.some(r => r.toLowerCase().includes(resistText.toLowerCase()))) {
							resistances.push(`${this._capitalizeFirst(resistText)} Resistance`);
						}
					}
					if (immuneMatch) {
						const immuneText = immuneMatch[1].trim();
						if (!resistances.some(r => r.toLowerCase().includes(immuneText.toLowerCase()))) {
							resistances.push(`${this._capitalizeFirst(immuneText)} Immunity`);
						}
					}
					if (vulnMatch) {
						const vulnText = vulnMatch[1].trim();
						if (!resistances.some(r => r.toLowerCase().includes(vulnText.toLowerCase()))) {
							resistances.push(`${this._capitalizeFirst(vulnText)} Vulnerability`);
						}
					}
				} else if (entry.entries && Array.isArray(entry.entries)) {
					entry.entries.forEach(subEntry => {
						if (typeof subEntry === "string") {
							const resistMatch = subEntry.match(/resistance to ([^.]+)/i);
							const immuneMatch = subEntry.match(/immune to ([^.]+)/i);
							const vulnMatch = subEntry.match(/vulnerable to ([^.]+)/i);

							if (resistMatch) {
								const resistText = resistMatch[1].trim();
								if (!resistances.some(r => r.toLowerCase().includes(resistText.toLowerCase()))) {
									resistances.push(`${this._capitalizeFirst(resistText)} Resistance`);
								}
							}
							if (immuneMatch) {
								const immuneText = immuneMatch[1].trim();
								if (!resistances.some(r => r.toLowerCase().includes(immuneText.toLowerCase()))) {
									resistances.push(`${this._capitalizeFirst(immuneText)} Immunity`);
								}
							}
							if (vulnMatch) {
								const vulnText = vulnMatch[1].trim();
								if (!resistances.some(r => r.toLowerCase().includes(vulnText.toLowerCase()))) {
									resistances.push(`${this._capitalizeFirst(vulnText)} Vulnerability`);
								}
							}
						}
					});
				}
			});
		}

		// Check condition immunities
		if (race.conditionImmune) {
			race.conditionImmune.forEach(condition => {
				resistances.push(`${this._capitalizeFirst(condition)} Immunity`);
			});
		}

		return resistances;
	}

	_createChoiceDropdown (type, index, choiceData, itemType) {
		const containerId = `${type}-choice-${index}-${Date.now()}`;
		const stateProp = `common_selected${this._capitalizeFirst(type)}_${index}`;
		
		// Parse choice data to get options
		let options = [];
		let count = 1;
		
		if (typeof choiceData === "number") {
			count = choiceData;
		} else if (typeof choiceData === "object") {
			if (choiceData.from && Array.isArray(choiceData.from)) {
				options = choiceData.from;
				count = choiceData.count || 1;
			}
		}
		
		// Create dropdown HTML
		const dropdownHtml = `
			<div class="ve-flex-col" id="${containerId}">
				<div class="ve-flex-v-center ve-mb-2">
					<div class="ve-flex-v-center ve-btn-group ve-w-100 ve-mr-2 ${type}-selector-container">
						<!-- ${itemType} selector will be inserted here -->
					</div>
				</div>
				<div class="ve-small ve-muted ve-mt-1">
					<span id="${type}-count-${containerId}">0</span>/${count} ${itemType}${count === 1 ? '' : 's'} selected
				</div>
			</div>`;

		// Initialize dropdown after DOM is ready
		setTimeout(() => {
			const container = document.querySelector(`#${containerId} .${type}-selector-container`);
			const countSpan = document.getElementById(`${type}-count-${containerId}`);
			
			if (container && countSpan) {
				// Initialize state for selection
				if (!this._parent._state[stateProp]) {
					this._parent._state[stateProp] = [];
				}
				
				// Get available options based on type
				let availableOptions = options;
				if (availableOptions.length === 0) {
					// Default options based on type
					if (itemType === "weapon") {
						availableOptions = ["Simple weapons", "Martial weapons", "Light armor", "Medium armor", "Heavy armor", "Shields"];
					} else if (itemType === "armor") {
						availableOptions = ["Light armor", "Medium armor", "Heavy armor", "Shields"];
					} else if (itemType === "tool") {
						availableOptions = ["Artisan's tools", "Musical instrument", "Gaming set", "Vehicle", "Disguise kit", "Forgery kit"];
					} else if (itemType === "skill") {
						availableOptions = ["Athletics", "Acrobatics", "Sleight of Hand", "Stealth", "Arcana", "History", "Investigation", "Nature", "Religion", "Animal Handling", "Insight", "Medicine", "Perception", "Survival", "Deception", "Intimidation", "Performance", "Persuasion"];
					}
				}
				
				const {wrp: selItem, setFnFilter: setFnFilterItem} = ComponentUiUtil.getSelSearchable(
					this._parent,
					stateProp,
					{
						values: availableOptions.map((_, i) => i),
						isAllowNull: true,
						isMultiple: true,
						fnDisplay: ix => {
							const option = availableOptions[ix];
							return option || "(Unknown)";
						},
						asMeta: true,
					},
				);
				
				container.innerHTML = "";
				container.appendChild(selItem);
				
				// Add filter functionality
				const doApplyFilterToSelItem = () => {
					setFnFilterItem(() => true);
				};
				
				doApplyFilterToSelItem();
				
				// Update count when selection changes
				const updateCount = () => {
					const selected = this._parent._state[stateProp] || [];
					countSpan.textContent = selected.length;
					
					// Enforce limit
					if (selected.length > count) {
						this._parent._state[stateProp] = selected.slice(0, count);
						countSpan.textContent = count;
					}
				};
				
				this._parent._addHookBase(stateProp, updateCount);
				updateCount();
			}
		}, 100);

		return dropdownHtml;
	}

	_capitalizeFirst (str) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
}
