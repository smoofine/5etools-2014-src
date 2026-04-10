class CharacterSheet {
	constructor () {
		this._characterData = null;
		this._isEditMode = false;
		this._$characterSheet = null;
	}

	async pInit () {
		this._$characterSheet = $(`#character-sheet`);
		this._bindEvents();
		this._renderEmptyState();
	}

	_bindEvents () {
		// File input events
		$("#file-input").on("change", (e) => this._handleFileLoad(e));
		$("#load-btn").on("click", () => this._handleLoadClick());
		$("#save-btn").on("click", () => this._handleSaveClick());
		$("#export-btn").on("click", () => this._handleExportClick());
		$("#clear-btn").on("click", () => this._handleClearClick());
		
		// Edit mode toggle
		$("#edit-mode-toggle").on("change", (e) => this._handleEditModeToggle(e));
	}

	_handleFileLoad (e) {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target.result);
				this._loadCharacterData(data);
			} catch (error) {
				alert("Invalid JSON file. Please select a valid statgen character file.");
			}
		};
		reader.readAsText(file);
	}

	_handleLoadClick () {
		$("#file-input").click();
	}

	_handleSaveClick () {
		if (!this._characterData) {
			alert("No character data to save. Please load a character first.");
			return;
		}

		if (this._isEditMode) {
			this._updateCharacterDataFromForm();
		}

		this._saveToLocalStorage();
		alert("Character saved successfully!");
	}

	_handleExportClick () {
		if (!this._characterData) {
			alert("No character data to export. Please load a character first.");
			return;
		}

		if (this._isEditMode) {
			this._updateCharacterDataFromForm();
		}

		const dataStr = JSON.stringify(this._characterData, null, 2);
		const blob = new Blob([dataStr], {type: "application/json"});
		const url = URL.createObjectURL(blob);
		
		const a = document.createElement("a");
		a.href = url;
		a.download = `character-${this._characterData.basic_charName || "unnamed"}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	_handleClearClick () {
		if (confirm("Are you sure you want to clear the current character?")) {
			this._characterData = null;
			this._renderEmptyState();
			localStorage.removeItem("characterSheet_data");
		}
	}

	_handleEditModeToggle (e) {
		this._isEditMode = e.target.checked;
		this._renderCharacterSheet();
	}

	_loadCharacterData (data) {
		// Validate that this looks like a statgen file
		if (!data.fileType || data.fileType !== "statgen") {
			alert("Invalid file type. Please select a statgen character file.");
			return;
		}

		// Extract the state from the data
		this._characterData = data.state || data;
		this._saveToLocalStorage();
		this._renderCharacterSheet();
	}

	_updateCharacterDataFromForm () {
		if (!this._characterData) return;

		// Update basic info
		this._characterData.basic_charName = $(`#char-name`).val();
		this._characterData.basic_playerName = $(`#player-name`).val();
		this._characterData.basic_alignment = $(`#alignment`).val();

		// Update ability scores if they exist in the data
		if (window.Parser && Parser.ABIL_ABVS) {
			Parser.ABIL_ABVS.forEach(ab => {
				const input = $(`#${ab}-score`);
				if (input.length) {
					const score = parseInt(input.val()) || 0;
					this._characterData[`common_export_${ab}`] = score;
				}
			});
		}
	}

	_saveToLocalStorage () {
		localStorage.setItem("characterSheet_data", JSON.stringify(this._characterData));
	}

	_loadFromLocalStorage () {
		const saved = localStorage.getItem("characterSheet_data");
		if (saved) {
			try {
				this._characterData = JSON.parse(saved);
				return true;
			} catch (e) {
				return false;
			}
		}
		return false;
	}

	_renderEmptyState () {
		this._$characterSheet.empty().append(`
			<div class="ve-text-center ve-muted ve-p-5">
				<i class="fas fa-user fa-3x ve-mb-3"></i>
				<h3>No Character Loaded</h3>
				<p>Use the file picker on the left to load a statgen character file.</p>
			</div>
		`);
	}

	_renderCharacterSheet () {
		if (!this._characterData) {
			this._renderEmptyState();
			return;
		}

		const abilities = window.Parser && Parser.ABIL_ABVS ? Parser.ABIL_ABVS : ['str', 'dex', 'con', 'int', 'wis', 'cha'];

		this._$characterSheet.empty().append(`
			<!-- Character Header -->
			<div class="ve-flex-col ve-p-4 ve-border-bottom">
				<h2 class="ve-text-center ve-mb-4">Character Information</h2>
				<div class="ve-flex ve-flex-wrap ve-gap-3 ve-justify-center">
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Character Name</label>
						${this._isEditMode ? 
							`<input type="text" id="char-name" class="ve-form-control" value="${this._characterData.basic_charName || ''}">` :
							`<div class="ve-form-control ve-bold">${this._characterData.basic_charName || '—'}</div>`
						}
					</div>
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Player Name</label>
						${this._isEditMode ? 
							`<input type="text" id="player-name" class="ve-form-control" value="${this._characterData.basic_playerName || ''}">` :
							`<div class="ve-form-control ve-bold">${this._characterData.basic_playerName || '—'}</div>`
						}
					</div>
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Alignment</label>
						${this._isEditMode ? 
							`<select id="alignment" class="ve-form-control">
								<option value="">Select alignment...</option>
								<option value="Lawful Good" ${this._characterData.basic_alignment === 'Lawful Good' ? 'selected' : ''}>Lawful Good</option>
								<option value="Neutral Good" ${this._characterData.basic_alignment === 'Neutral Good' ? 'selected' : ''}>Neutral Good</option>
								<option value="Chaotic Good" ${this._characterData.basic_alignment === 'Chaotic Good' ? 'selected' : ''}>Chaotic Good</option>
								<option value="Lawful Neutral" ${this._characterData.basic_alignment === 'Lawful Neutral' ? 'selected' : ''}>Lawful Neutral</option>
								<option value="True Neutral" ${this._characterData.basic_alignment === 'True Neutral' ? 'selected' : ''}>True Neutral</option>
								<option value="Chaotic Neutral" ${this._characterData.basic_alignment === 'Chaotic Neutral' ? 'selected' : ''}>Chaotic Neutral</option>
								<option value="Lawful Evil" ${this._characterData.basic_alignment === 'Lawful Evil' ? 'selected' : ''}>Lawful Evil</option>
								<option value="Neutral Evil" ${this._characterData.basic_alignment === 'Neutral Evil' ? 'selected' : ''}>Neutral Evil</option>
								<option value="Chaotic Evil" ${this._characterData.basic_alignment === 'Chaotic Evil' ? 'selected' : ''}>Chaotic Evil</option>
							</select>` :
							`<div class="ve-form-control ve-bold">${this._characterData.basic_alignment || '—'}</div>`
						}
					</div>
				</div>
			</div>

			<!-- Race & Background -->
			<div class="ve-flex-col ve-p-4 ve-border-bottom">
				<h3 class="ve-text-center ve-mb-3">Race & Background</h3>
				<div class="ve-flex ve-flex-wrap ve-gap-3">
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Race</label>
						<div class="ve-form-control ve-bold">${this._getRaceName() || '—'}</div>
					</div>
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Background</label>
						<div class="ve-form-control ve-bold">${this._getBackgroundName() || '—'}</div>
					</div>
				</div>
			</div>

			<!-- Ability Scores -->
			<div class="ve-flex-col ve-p-4">
				<h3 class="ve-text-center ve-mb-3">Ability Scores</h3>
				<div class="ve-flex ve-flex-wrap ve-gap-3 ve-justify-center">
					${abilities.map(ab => `
						<div class="ve-form-group">
							<label class="ve-bold ve-mb-1 ve-small">${this._getAbilityName(ab)} (${ab.toUpperCase()})</label>
							${this._isEditMode ? 
								`<input type="number" id="${ab}-score" class="ve-form-control" min="1" max="20" value="${this._characterData[`common_export_${ab}`] || 0}">` :
								`<div class="ve-flex ve-justify-between ve-form-control">
									<span class="ve-bold">${this._characterData[`common_export_${ab}`] || 0}</span>
									<span class="ve-muted">(${this._getAbilityModifier(this._characterData[`common_export_${ab}`] || 0)})</span>
								</div>`
							}
						</div>
					`).join('')}
				</div>
			</div>

			<!-- ASI & Feats -->
			${this._renderAsiFeatsSection()}
		`);
	}

	_getRaceName () {
		if (!this._characterData.common_raceChoiceMetasFrom || this._characterData.common_raceChoiceMetasFrom.length === 0) {
			return null;
		}
		
		const raceId = this._characterData.common_raceChoiceMetasFrom[0];
		// This would need to be mapped to actual race data - for now just return the ID
		return raceId || "Unknown Race";
	}

	_getBackgroundName () {
		if (!this._characterData.common_backgroundChoiceMetasFrom || this._characterData.common_backgroundChoiceMetasFrom.length === 0) {
			return null;
		}
		
		const backgroundId = this._characterData.common_backgroundChoiceMetasFrom[0];
		// This would need to be mapped to actual background data - for now just return the ID
		return backgroundId || "Unknown Background";
	}

	_getAbilityName (ab) {
		const names = {
			'str': 'Strength',
			'dex': 'Dexterity', 
			'con': 'Constitution',
			'int': 'Intelligence',
			'wis': 'Wisdom',
			'cha': 'Charisma'
		};
		return names[ab] || ab.toUpperCase();
	}

	_getAbilityModifier (score) {
		return Math.floor((score - 10) / 2);
	}

	_renderAsiFeatsSection () {
		if (!this._characterData.common_cntAsi && !this._characterData.common_cntFeatsCustom) {
			return '';
		}

		const asiCount = this._characterData.common_cntAsi || 0;
		const featCount = this._characterData.common_cntFeatsCustom || 0;

		return `
			<div class="ve-flex-col ve-p-4 ve-border-top">
				<h3 class="ve-text-center ve-mb-3">Ability Score Improvements & Feats</h3>
				<div class="ve-flex ve-flex-wrap ve-gap-3">
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">ASI Count</label>
						<div class="ve-form-control ve-bold">${asiCount}</div>
					</div>
					<div class="ve-form-group">
						<label class="ve-bold ve-mb-1 ve-small">Custom Feats</label>
						<div class="ve-form-control ve-bold">${featCount}</div>
					</div>
				</div>
			</div>
		`;
	}
}

// Initialize the character sheet when page loads
window.addEventListener("load", () => {
	const characterSheet = new CharacterSheet();
	characterSheet.pInit();
	
	// Try to load from localStorage
	if (characterSheet._loadFromLocalStorage()) {
		characterSheet._renderCharacterSheet();
	}
});
