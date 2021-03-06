var gridEditor = {
	state: null,
	init: function(event) {
		this.el = event.target;
	},
	onclick: function(event) {
		if (event.target.name != "deleteItem") {return;}
		var select = this.el.querySelector('[name="track"]');
		if (select.selectedIndex == -1) {return;}
		var option = select.options[select.selectedIndex];
		var arr = option.value.split("-");
		var itemType = arr[0]; // tack or cell
		var itemIndex = arr[1]*1;	
		if (itemType == 'cell') {
			config.cells.splice(itemIndex, 1);
		} else if (itemType == 'col') {
			config.cols.splice(itemIndex, 1);
		} else if (itemType == 'row') {
			config.rows.splice(itemIndex, 1);
		}
		// Reflect config changes in the state
		app.updateState({q: window.btoa(JSON.stringify(config || {})), row: null, col: null, cell: null});
	},
	onconnected: function() {
		window.addEventListener('statechange', this);
	},
	onstatechange: function(event) {
		var newState = event.detail.newState;
		var changes = event.detail.changed;
		// Smart render
		if (!this.state) {
			this.state = newState;			
			this.render();
		} else if (changes.row !== undefined || changes.col !== undefined || changes.cell !== undefined || changes.q !== undefined) {
			this.state = event.detail.newState
			this.render();			
		} else {
			this.state = event.detail.newState
		}
	},
	onchange: function(event) {
		if (event.target.name == "track") { // Switch track
			// detect if track or grid item was selected
			var arr = event.target.value.split("-");
			var type = arr[0];
			var value = arr[1];
			var changes = {
				cell: null,
				col: null,
				row: null
			}
			changes[type] = value;
			app.updateState(changes);
			return;
		} else if (event.target.name == "align") {
			config.align = event.target.value;
		} else if (event.target.name == "justify") {
			config.justify = event.target.value;
		} else if (event.target.name == "value") { // Update config for tracks
			if (this.state.col) {
				config.cols[1*this.state.col] = event.target.value;
			} else if (this.state.row) {
				config.rows[1*this.state.row] = event.target.value;
			} 		
		} else if (event.target.name.indexOf("cell-") != -1) { // Update config for cell
			var arr = event.target.name.split("-");
			var cellProperty = arr[1];
			var cellIndex = 1*this.state.cell;
			if (arr[0] != 'cell') {return;}
			if (!config.cells[cellIndex]) {config.cells[cellIndex] = {};}
			config.cells[cellIndex][cellProperty] =  event.target.value;
		} else if (event.target.name == "rows") {
			config.rows.length = 1*event.target.value || 0;
		} else if (event.target.name == "cols") {
			config.cols.length = 1*event.target.value || 0;
		} else if (event.target.name == "cells") {
			config.cells.length = 1*event.target.value || 0;
		} else {
			return;
		}

		// Reflect config changes in the state
		app.updateState({q: window.btoa(JSON.stringify(config || {}))});
	},
	updateField: function(name, value) {
		if (!this.el) {return;}
		var fieldEl = this.el.querySelector('[name="'+name+'"]')
		if (!fieldEl) {return;}
		fieldEl.value = value;
	},
	updateSelect: function(name, optionIndex,  value, label) {
		if (!this.el) {return;}
		var fieldEl = this.el.querySelector('[name="'+name+'"]');
		if (!fieldEl) {return;}
		if (!fieldEl.options[optionIndex]) {fieldEl.appendChild(document.createElement('option'))}
		fieldEl.options[optionIndex].setAttribute('value', value);
		fieldEl.options[optionIndex].innerHTML = label;
		return fieldEl;
	},
	updateCell: function(cellProperties) {
		if (!cellProperties || typeof cellProperties != "object") {return;}
		this.updateField("cell-col", cellProperties.col || "");
		this.updateField("cell-text", cellProperties.text || "");
		this.updateField("cell-colSpan", cellProperties.colSpan || "");
		this.updateField("cell-rowSpan", cellProperties.rowSpan || "");
		this.updateField("cell-row", cellProperties.row || "");
		this.updateField("cell-align", cellProperties.align || "");
		this.updateField("cell-justify", cellProperties.justify || "");
	},
	render: function() {
		this.updateField('rows',  config.rows.length);
		this.updateField('cols',  config.cols.length);
		this.updateField('cells', config.cells.length);
		this.updateField("align", config.align || "");
		this.updateField("justify", config.justify || "");
		
		var selectField, value, cellIndex;


		// Update rows
		this.el.querySelector('[name="track"]').innerHTML =""; // clear options
		for(var i=0;i<config.rows.length; i++) {
			selectField = this.updateSelect('track', i, "row-" + i, 'row ' + (i+1));
		}
		if (selectField && this.state && this.state.row >=0) {
			selectField.selectedIndex = 1*this.state.row;
			value = config.rows[1*this.state.row];
		}

		// Update cols
		for(var j=0; j<config.cols.length; j++) {
			selectField = this.updateSelect('track', i+j, "col-" + j, 'col ' + (j+1));
		}
		if (selectField && this.state && this.state.col>=0) {
			selectField.selectedIndex = i+1*this.state.col;
			value = config.cols[1*this.state.col];
		}
		
		// Update cells
		for(var k=0; k<config.cells.length; k++) {
			selectField = this.updateSelect('track', i+j+k, "cell-" + k, 'cell ' + (k+1));
		}
		if (selectField && this.state && this.state.cell>=0) {
			cellIndex = 1*this.state.cell;
			value = config.cells[cellIndex];
			selectField.selectedIndex = i+j+cellIndex;
		}

		// Default selection
		if (value === undefined ) {
			value = config.rows[0] || config.cols[0] || "";
		}
		
		if (selectField) {
			if (cellIndex !== undefined) { // Cell
				this.el.querySelector('#cellProperties').classList.remove('d-none');
				this.el.querySelector('[name="value"]').parentNode.classList.add('d-none');
				this.updateCell(config.cells[cellIndex]);
			} else { // Track				
				this.el.querySelector('#cellProperties').classList.add('d-none');
				this.el.querySelector('[name="value"]').parentNode.classList.remove('d-none');
				this.updateField('value', value);
			}
		}

	}
};