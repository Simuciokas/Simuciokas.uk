var locationLabels = [];
var ovconf;

overviewer.util.ready(function () {
	initLocationLabels();
});

function loadLocationLabels() {
	for (var l in locationLabels) {
		locationLabels[l].addTo(overviewer.map);
	}
}

function removeLocationLabels() {
	for (var l in locationLabels) {
		locationLabels[l].remove();
	}
}

function labelHtml(title, fontsize, color) {
	var t = '<div style="text-align:center; z-index:203;">';
	t += '<span style="position: relative;';
	t += 'white-space: nowrap; font-weight: bold;';
	t += 'font-family: \'Titillium Web\', sans-serif; text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black, 3px 3px 3px #000;';
	t += 'margin-left: -150px;';
	t += 'width: 300px;';
	t += 'min-width: 300px;';
	t += 'display: block;';
	t += 'text-align: center; color:' + color + ';font-size:' + fontsize + 'px;"';
	t += '>' + title + '</span></div>';
	return t;
}

function addLabel(name, {x, y, z}) {
	var latLng = overviewer.util.fromWorldToLatLng(x, y, z, ovconf)
  label = new L.DivIcon({iconSize:[0,0], className:'wcLabel', html: labelHtml(name, '12', '#c4c2c2')});
  l = L.marker(latLng, {icon:label, zIndexOffset:0});
  l.addTo(overviewer.map);
	locationLabels.push(l);
}

function initLocationLabels() {
	ovconf = overviewer.current_layer[overviewer.current_world].tileSetConfig;
	if (!ovconf.hideLabels) {
		$.get('/data/map/labels.json', (data, error) => {
			if (data) {
				data.forEach(d => addLabel(d.name, d.location))
			}
		})
	}
}
