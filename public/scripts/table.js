angular
	.module('app', ['ui.bootstrap', 'ngSanitize', 'angular.filter'])
	.constant('TIME_FORMAT', 'DD/MM/YYYY')
	.constant('SHORT_TIME_FORMAT', 'DD/MM')
	.constant('ROWS_LOAD', 365)
	.run(function(Utils) {
		$(window).on('resize', function() { 
			var obj = Utils.getHeightWidth();
			var $ht = $('#handsontable');
			$ht.width(obj.width).height(obj.height);
		});
	})
	.factory('Utils', function($modal, TIME_FORMAT) {
		
		var obj = {};
		obj.leaves = {
			A: {
				title: 'Available',
				background: '#FFF',
				color: '#333'
			},
			V: {
				title: 'Vacation',
				background: '#777777',
				color: '#FFF'
			},
			P: {
				title: 'Public Holiday',
				background: '#9B6A90',
				color: '#FFF'
			},
			T: {
				title: 'Training',
				background: '#999E17',
				color: '#FFF'
			}
		};
		obj.workstreams = {
			PRO: {
				title: 'Proposition Development',
				background: '#777',
				color: '#FFF'
			},
			ENG: {
				title: 'Engineering',
				background: '#0000FF',
				color: '#FFF'
			},
			SAL: {
				title: 'Sales & Marketing',
				background: '#800080',
				color: '#FFF'
			},
			MGT: {
				title: 'Project Management',
				background: '#008000',
				color: '#FFF'
			}
		};
		obj.getHeightWidth = function() {
			var $ht = $('#handsontable');
			var $window = $(window);
			var offset = $ht.offset();
			var availableWidth = $window.width() - offset.left + $window.scrollLeft();
			var availableHeight = $window.height() - offset.top + $window.scrollTop();
			return {
				height: availableHeight,
				width: availableWidth
			};
		};
		obj.open = function(templateUrl, controller, size, resolve) {
			return $modal.open({
				templateUrl: templateUrl,
				controller: controller,
				size: size,
				resolve: resolve
			});
		};
		obj.openAddAbsenceModal = function (userid, username, start, end, unit, value, edit) {

			var modalInstance = obj.open('addAbsenceModal.html', 'AddAbsenceModalInstanceCtrl', null, {
				form: function () {
					return {
						start: start,
						end: end,
						leaves: obj.leaves,
						value: value || 'V',
						am: unit == 'AM',
						pm: unit == 'PM',
						edit: edit
					};
				},
				user: function() {
					return {
						id: userid,
						name: username
					};
				}
			});

			modalInstance.result.then(function (selectedItem) {
				//console.log('now', selectedItem);
			}, function () {
				//console.log('Modal dismissed at: ' + new Date());
			});
		};
		obj.isWeekEnd = function(date) {
			if(!moment.isMoment(date)) {
				date = moment.utc(date, TIME_FORMAT);
			}
			return date.weekday() == 6 || date.weekday() == 0;
		};
		obj.addDays = function(date, days) {
			if(!moment.isMoment(date)) {
				date = moment.utc(date, TIME_FORMAT);
			}
			// will have to add days one by one
			if(days < 0) {
				for(var i=days; i<0; i++) {
					date.add(-1, "days");
					while(obj.isWeekEnd(date)) {
						date.add(-1, "days");
					}
				}
			} else {
				for(var i=1; i<=days; i++) {
					date.add(1, "days");
					while(obj.isWeekEnd(date)) {
						date.add(1, "days");
					}
				}
			}
			return date;
		};
		obj.isEmpty = function(o) {
			o = o == undefined ? '' : o;
			if(typeof o === "string") {
				return o === '' || o.length === 0;
			}
			else if(typeof o === "object") {
				if(o.length) { // array
					return o.length === 0;
				}
				else {
					return Object.keys(o).length === 0;
				}
			}
			else if(typeof o === "number") {
				return false;
			}
		};
		obj.unique = function (t) {
			var arr = typeof t == "object" && t.length>0 ? t : [];
			return $.grep(arr, function (v, i) {
				return $.inArray(v, arr) === i;
			});
		};
		obj.remove = function(arr1, arr2) {
			return arr1.filter(function(i) {return arr2.indexOf(i) < 0;});
		};
		obj.removeNulls = function(t) {
			var arr = typeof t == "object" && t.length>0 ? t : [];
			arr = arr.filter(function(a) {
				return !isNaN(a);
			});
			return arr;
		};
		obj.pushAll = function(arr, copyarr) {
			arr = typeof arr == "object" && arr.length>0 ? arr : [];
			copyarr = typeof copyarr == "object" && copyarr.length>0 ? copyarr : [];
			$.each(copyarr, function(a) {
				arr.push(a);
			});
			return obj.unique(arr);
		};
		obj.initials = function(name) {
			name = name || '';
			var names = name.split(' ');
			var letters = names.map(function(n) {
				return n.charAt(0);
			});
			return letters.join('').toUpperCase();
		};
		obj.updateListOnServer = function(list) {
			console.log("EXAMPLE SERVER UPDATE REQUEST:", list);
		};
		return obj;
	})
	.controller('BodyController', function($scope, $modal, $log, Utils) {
		
		$scope.userid = userid;
		$scope.username = username;
		$scope.users = users;
		
	})
	.controller('MyController', function ($scope, $timeout, $log, Utils, TIME_FORMAT, SHORT_TIME_FORMAT, ROWS_LOAD) {
		
		/* load data rows, columns, cells */
		$scope.loadData = function (start, days) {
			
			if(!moment.isMoment(start)) {
				start = moment.utc(start, TIME_FORMAT);
			}
			
			var db = {};
			db.columns = [{title: '&nbsp;', data: 'Date', width: 80, readOnly: true, renderer: "html"}];
			db.rows = [];
			db.rowHeaders = [];
			db.mergeCells = [];
			
			/* columns */
			for (var i in $scope.users) {
				var user = $scope.users[i];
				var initials = Utils.initials(user.name);
				db.columns.push({
					title: initials,
					data: user.userid + ':AM',
					width: 22,
					readOnly: true,
					renderer: "html",
					team: user.workstreamid
				});
				db.columns.push({
					title: initials,
					data: user.userid + ':PM',
					width: 22,
					readOnly: true,
					renderer: "html",
					team: user.workstreamid
				});
			}
			
			/* row headers */
			for (var i = 0; i < days; i++) {
				var thisDay = start.clone().add(i, 'days');
				if (Utils.isWeekEnd(thisDay)) {
					continue;
				}
				db.rowHeaders.push(thisDay.format(TIME_FORMAT));
			}
			
			/* rows */
			var groupByInitial = {};
			db.columns.forEach(function(a) {
				if(a.team) {
					var workstream = Utils.workstreams[a.team];
					groupByInitial[a.data] = '<span class="badge header-person-team" style="background-color: '+
						workstream.background +'; color: '+workstream.color+'">'+a.team+'</span>'
						+ '<span class="badge header-person-initials">'+a.title+'</span>';
				} else {
					groupByInitial[a.data] = a.title;
				}
			});
			db.rows.push(groupByInitial);
			
			var groupByDate = {};
			list.forEach(function (f) {
				var date_unit = f.date + ':' + f.unit;
				groupByDate[date_unit] = groupByDate[date_unit] || [];
				groupByDate[date_unit].push(f);
			});

			db.rowHeaders.forEach(function(date) {
				var groupByInitial = {};
				groupByInitial['Date'] = date;
				
				var leaves = groupByDate[date+':AM'];
				if(leaves && leaves.length>0) {
					leaves.forEach(function (f) {
						groupByInitial[f.userid+':AM'] = f.value;
					});
				}
				leaves = groupByDate[date+':PM'];
				if(leaves && leaves.length>0) {
					leaves.forEach(function (f) {
						groupByInitial[f.userid+':PM'] = f.value;
					});
				}
				db.rows.push(groupByInitial);
			});
			
			/* merge header cells */
			db.mergeCells = [];
			db.columns.forEach(function (f, i) {
				if (i % 2 == 0) {
					return;
				}
				db.mergeCells.push({
					row: 0, col: i, rowspan: 1, colspan: 2
				});
			});
			
			return db;
		};
		
		Utils.db = $scope.db = $scope.loadData(moment.utc(), ROWS_LOAD);
		
		/* different renderers */
		var colHeaderRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.HtmlRenderer.apply(this, arguments);
			if(value) {
				$(td).css({
					'border-width': '0px'
				});
			}
		};
		var colorRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.TextRenderer.apply(this, arguments);
			if(value && Utils.leaves[value]) {
				$(td).css({
					'background-color': Utils.leaves[value].background,
					'color': Utils.leaves[value].background
				});
			}
			if(prop.split(':')[0] == $scope.userid) {
				if(prop.split(':')[1] == 'PM') {
					$(td).css('border-right', '2px solid #08c');
				} else {
					$(td).css('border-left', '2px solid #08c');
				}
			}
		};
		var noRightBorderRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.TextRenderer.apply(this, arguments);
			$(td).css({
				'border-right': 'none'
			});
			colorRenderer.apply(this, arguments);
		};
		var doubleThicknessRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.TextRenderer.apply(this, arguments);
			$(td).css({
				'border-bottom-width': '2px'
			});
			colorRenderer.apply(this, arguments);
		};
		var noRightBorderDoubleThicknessRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.TextRenderer.apply(this, arguments);
			$(td).css({
				'border-right': 'none',
				'border-bottom-width': '2px'
			});
			colorRenderer.apply(this, arguments);
		};
		
		var availableSize = Utils.getHeightWidth();
		
		/* initialize handsontable */
		$('#handsontable').handsontable({
			data: $scope.db.rows,
			columns: $scope.db.columns,
			colHeaders: false,
			mergeCells: $scope.db.mergeCells,
			fixedColumnsLeft: 1,
			fixedRowsTop: 1,
			height: availableSize.height,
			width: availableSize.width,
			cells: function (row, col, prop) {
				if (row == 0) {
					this.renderer = colHeaderRenderer;
				} else {
					this.renderer = colorRenderer;
					if (col % 2 === 1) {
						this.renderer = noRightBorderRenderer;
					}
					if (row % 5 == 0) {
						this.renderer = doubleThicknessRenderer;
					}
					if (col % 2 === 1 && row % 5 === 0) {
						this.renderer = noRightBorderDoubleThicknessRenderer;
					}
				}
			},
			fillHandle: false,
			afterRender: function(isForced) {
				$('#scroll-left').height($('#handsontable').height());
				$('#scroll-right').height($('#handsontable').height());
			},
			afterSelectionEnd: function(r, c, r2, c2) {
				var ht = $('#handsontable').handsontable('getInstance');
				var col = Object.keys(ht.getData()[0]).indexOf($scope.userid+':AM');
				var useridAtColCurrent = ht.colToProp(col).split(':')[0]; // column may have hidden
				if(useridAtColCurrent == $scope.userid && 
				   	r!=0 && r2!= 0 && (c==col || c==(col+1)) && (c2==col || c2==(col+1))) {
					var s = ht.getSelected();
					var dates = [ht.getDataAtCell(s[0], 0), ht.getDataAtCell(s[2], 0)];
					var unit = (s[1] == s[3] ? (s[1]%2==0 ? 'PM' : 'AM') : undefined);
					Utils.openAddAbsenceModal($scope.userid, $scope.username, dates[0], dates[1], unit);
				} else {
					ht.deselectCell();
				}
			}
		});
		
	})
	.controller('LegendController', function($scope, $modal, $log, Utils) {
		
		$scope.leaves = Utils.leaves;
		$scope.workstreams = Utils.workstreams;
		$scope.workstreamsShown = Object.keys(Utils.workstreams);
		$scope.usersShown = $scope.users.map(function(u) {
			return u.userid;
		});
		$scope.inARow = parseInt($($('.person-container:visible')[0]).width() / 31.6);
		
		$(window).on('resize', function() {
			var $p = $($('.person-container:visible')[0]);
			$scope.$apply(function() {
				$scope.inARow = parseInt($p.width() / 31.6);
			});
		});
		
		// functions
		$scope.initials = Utils.initials;
		
		$scope.isWorkstreamShown = function(workstream) {
			return $scope.workstreamsShown.indexOf(workstream) != -1;
		};
		
		/* filter columns by workstreams */
		$scope.filterByWorkstream = function(workstream) {
			
			var workstreams = Object.keys(Utils.workstreams);
			if(workstreams.length == $scope.workstreamsShown.length) { // all workstreams are showing
				$scope.workstreamsShown = [workstream];
			} else { // some are showing
				var ind = $scope.workstreamsShown.indexOf(workstream);
				if(ind > -1) {
					$scope.workstreamsShown.splice(ind, 1);
				} else {
					$scope.workstreamsShown.push(workstream);
				}
			}
			if($scope.workstreamsShown.length == 0)
				$scope.workstreamsShown = workstreams;
			
			var columnsToRemove = Utils.db.columns.filter(function(d) {
				return d.team ? $scope.workstreamsShown.indexOf(d.team) == -1 : false;
			});
			var columnsToShow = Utils.remove(Utils.db.columns, columnsToRemove);
			var ht = $('#handsontable').handsontable('getInstance');
			ht.updateSettings({columns: columnsToShow});
			
			// update users shown based on workstreams shown
			var usersShown = $scope.users.filter(function(u) {
				return $scope.workstreamsShown.indexOf(u.workstreamid) != -1;
			});
			$scope.usersShown = usersShown.map(function(u) {
				return u.userid;
			});
		};
		
		$scope.isUserShown = function(userid) {
			return $scope.usersShown.indexOf(userid) != -1;
		};
		
		/* filter columns by users */
		$scope.filterByUser = function(userid) {
			
			var allUsers = $scope.users.map(function(u) {
				return u.userid;
			});
			if(allUsers.length == $scope.usersShown.length) { // all workstreams are showing
				$scope.usersShown = [userid];
			} else { // some are showing
				var ind = $scope.usersShown.indexOf(userid);
				if(ind > -1) {
					$scope.usersShown.splice(ind, 1);
				} else {
					$scope.usersShown.push(userid);
				}
			}
			if($scope.usersShown.length == 0)
				$scope.usersShown = allUsers;
			
			var columnsToRemove = Utils.db.columns.filter(function(d) {
				if(d.data.indexOf(':') != -1) {
					var d_userid = d.data.split(':')[0];
					return $scope.usersShown.indexOf(d_userid) == -1;
				} else {
					return false;
				}
			});
			var columnsToShow = Utils.remove(Utils.db.columns, columnsToRemove);
			var ht = $('#handsontable').handsontable('getInstance');
			ht.updateSettings({columns: columnsToShow});
		};
		
		/* Add a leave on click on button */
		$scope.addLeave = function() {
			Utils.openAddAbsenceModal($scope.userid, $scope.username);
		};
		
	})
	.controller('AddAbsenceModalCtrl', function ($scope, $modal, $log) {
		
	})
	.controller('AddAbsenceModalInstanceCtrl', function ($scope, $modalInstance, form, user, Utils, TIME_FORMAT) {

		$scope.form = form;
		$scope.user = user;
		$scope.users = users;
		$scope.list = list;
		
		//console.log(JSON.stringify(form));
		//console.log(Utils.db);
		
		if(!form.edit) {
			if(form.am==false && form.pm==false) {
				$scope.form.am = true;
				$scope.form.pm = true;
			}
		}
		
		var traverseSlots = function(slots, date, user, overlaps) {
			if(!moment.isMoment(date)) {
				date = moment.utc(date, TIME_FORMAT);
			}
			date = date.format(TIME_FORMAT);

			slots.forEach(function(slot) {
				for(var i in Utils.db.rows) {
					var obj = Utils.db.rows[i];
					var userids = Object.keys(obj); // '4:AM', '4:PM', '11:AM', ...

					if(obj['Date'] === date) {
						for(var id in userids) {
							if(userids[id].indexOf(':') > -1)
								overlaps.push(userids[id].split(':')[0]);
						}
					}
				}
			});
		};

		var getClashingUsers = function (overlaps) {
			var names = [];
			if(overlaps.length > 0) {
				for(var i in overlaps) {
					var user = $scope.users.filter(function(f) {
						return f.userid == overlaps[i];
					});
					if(user[0].userid != $scope.user.id) {
						names.push(user[0].name);
					}
				}	
			}
			return names;
		};
		
		/* Clash Messages */
		$scope.clashMsg = function() {
			var start = $scope.form.start, 
				end = $scope.form.end,
				slots = [];
			if($scope.form.am) slots.push('AM');
			if($scope.form.pm) slots.push('PM');
			
			var startMoment = moment(start, TIME_FORMAT, true),
				endMoment = moment(end, TIME_FORMAT, true);
			
			var clashes = {};
			
			if(startMoment && endMoment && slots.length>0) {
				//show message if user has already applied to leaves on these days
				var overlapDates = [];
				while (startMoment <= endMoment) {
					var date = startMoment.format(TIME_FORMAT);
					slots.forEach(function(slot) {
						for(var i in Utils.db.rows) {
							var obj = Utils.db.rows[i];
							var userids = Object.keys(obj); // '4:AM', '4:PM', '11:AM', ...

							if(obj['Date'] === date && obj[$scope.user.id+':'+slot]) {
								overlapDates.push(date+' '+(slot == 'AM' ? 'Morning' : 'Afternoon'));
							}
						}
					});
					startMoment.add(1, 'days');
				}
				overlapDates = Utils.unique(overlapDates);
				if(overlapDates.length > 0) {
					clashes.danger = 'You have already applied to leaves on '+overlapDates.join(', ')+'. Submitting the information below will update the leaves.';
				}
				
				// check overlapping
				startMoment = moment(start, TIME_FORMAT, true);
				endMoment = moment(end, TIME_FORMAT, true);
				var overlaps = [];
				while (startMoment <= endMoment) {
					traverseSlots(slots, startMoment, user, overlaps);
					startMoment.add(1, 'days');
				}
				overlaps = Utils.unique(overlaps);
				var names = getClashingUsers(overlaps);
				if(names.length > 0) {
					clashes.warning = 'Your absenteeism overlaps with '+names.join(', ')+'.';
				}
				
				// check adjacent
				startMoment = moment(start, TIME_FORMAT, true);
				endMoment = moment(end, TIME_FORMAT, true);
				var adjacents = [];
				while (startMoment <= endMoment) {
					var startCopy;
					startCopy = Utils.addDays(startMoment.clone(), -1); // before 1 day
					traverseSlots(slots, startCopy, user, adjacents);
					
					startCopy = Utils.addDays(startMoment.clone(), 1); // upcoming 1 day
					traverseSlots(slots, startCopy, user, adjacents);
					
					startMoment.add(1, 'days');
				}
				adjacents = Utils.unique(adjacents);
				adjacents = Utils.remove(adjacents, overlaps);
				var names = getClashingUsers(adjacents);
				if(names.length > 0) {
					clashes.info = 'Your absenteeism is adjacent with '+names.join(', ')+'.';
				}
				
				// check within 4 days
				startMoment = moment(start, TIME_FORMAT, true);
				endMoment = moment(end, TIME_FORMAT, true);
				merges = Utils.merges;
				var within4 = [];
				while (startMoment <= endMoment) {
					var startCopy;
					startCopy = Utils.addDays(startMoment.clone(), -2); // before 2 days
					traverseSlots(slots, startCopy, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 2); // upcoming 2 days
					traverseSlots(slots, startCopy, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), -3); // before 3 days
					traverseSlots(slots, startCopy, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 3); // upcoming 3 days
					traverseSlots(slots, startCopy, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), -4); // before 4 days
					traverseSlots(slots, startCopy, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 4); // upcoming 4 days
					traverseSlots(slots, startCopy, user, within4);
					
					startMoment.add(1, 'days');
				}
				within4 = Utils.unique(within4);
				within4 = Utils.remove(within4, overlaps);
				within4 = Utils.remove(within4, adjacents);
				var names = getClashingUsers(within4);
				if(names.length > 0) {
					clashes.success = 'Your absenteeism is within 4 days of '+names.join(', ')+'.';
				}
				
			}
			
			return Utils.isEmpty(clashes) ? undefined : clashes;
		};

		/* Add a leave */
		$scope.ok = function () {
			var data = $scope.form;
			$scope.form.errors = {};
			var startMoment = moment(data.start, TIME_FORMAT, true),
				endMoment = moment(data.end, TIME_FORMAT, true);
			
			var today = moment().startOf('day');
			var endOfYear = moment().add(12, 'months').subtract(1, 'days');
			if(!data.start || !startMoment.isValid()) {
				$scope.form.errors.start = 'Please enter valid start date in DD/MM/YYYY format.';
			} else if(startMoment.isBefore(today)) {
				$scope.form.errors.start = 'Start Date cannot be before today.';
			} else if(startMoment.isAfter(endOfYear)) {
				$scope.form.errors.start = 'Start Date cannot be after 12 months from today.';
			}
			if(!data.end || !endMoment.isValid()) {
				$scope.form.errors.end = 'Please enter valid end date in DD/MM/YYYY format.';
			} else if(endMoment.isBefore(today)) {
				$scope.form.errors.end = 'End Date cannot be before today.';
			} else if(endMoment.isAfter(endOfYear)) {
				$scope.form.errors.end = 'End Date cannot be after 12 months from today.';
			}
			if(!$scope.form.errors.start && !$scope.form.errors.end && startMoment.isAfter(endMoment)) {
				$scope.form.errors.start = 'Start Date should be before End Date.';
				$scope.form.errors.end = 'End Date should be after Start Date.';
			}
			if(!data.am && !data.pm) {
				$scope.form.errors.unit = 'Please select at least one slot.';
			}
			if(!Utils.isEmpty($scope.form.errors)) {
				return;
			}
			
			var ht = $('#handsontable').handsontable('getInstance');
			var calData = ht.getData();
			while (startMoment <= endMoment) {
				if(Utils.isWeekEnd(startMoment)) { // skip weekends
					startMoment.add(1, 'days');
					continue;
				}
				var date = startMoment.format(TIME_FORMAT);
				var slots = [];
				if(data.am) slots.push('AM');
				if(data.pm) slots.push('PM');
				
				slots.forEach(function(slot) {
					for(var i in Utils.db.rows) {
						var obj = Utils.db.rows[i];
						var userids = Object.keys(obj); // '4:AM', '4:PM', '11:AM', ...

						if(obj['Date'] === date) {
							if($scope.form.value == 'A') {
								delete obj[$scope.user.id+':'+slot];
								for(var i in $scope.list) {
									var o = $scope.list[i];
									if(o.date == date && o.unit == slot && o.userid == $scope.user.id) {
										$scope.list.splice(i, 1);
										break;
									}
								}
							} else {
								obj[$scope.user.id+':'+slot] = $scope.form.value;
								for(var i in $scope.list) {
									var o = $scope.list[i];
									if(o.date == date && o.unit == slot && o.userid == $scope.user.id) {
										o.value = $scope.form.value;
										break;
									}
								}
							}
						}
					}
				});
				startMoment.add(1, 'days');
			}
			
			ht.updateSettings({
				data: Utils.db.rows
			});
			Utils.updateListOnServer($scope.list);
			$modalInstance.close('success');
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	});