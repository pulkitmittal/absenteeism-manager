angular
	.module('app', ['ui.calendar', 'ui.bootstrap', 'ngSanitize'])
	.constant('TIME_FORMAT', 'DD/MM/YYYY')
	.factory('Utils', function($modal, TIME_FORMAT) {
		
		var obj = {};
		obj.merges = {};
		obj.eventSources = [];
		obj.getEventSources = function() {
			return obj.eventSources;
		};
		obj.leaves = {
			V: 'Vacation',
			P: 'Public Holiday',
			T: 'Training'
		};
		obj.open = function(templateUrl, controller, size, resolve) {
			return $modal.open({
				templateUrl: templateUrl,
				controller: controller,
				size: size,
				resolve: resolve
			});
		};
		/* Open Add Absence Modal */
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
				console.log('now', selectedItem);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
		obj.confirm = function (message) {

			var modalInstance = obj.open('confirmationModal.html', 'ConfirmationModalInstanceCtrl', 'sm', {
				message: function () {
					return message;
				}
			});
			
			return modalInstance;			
		};
		obj.isBeforeToday = function(date) {
			return moment.utc(date, TIME_FORMAT, true).isBefore(moment.utc().startOf('day'));
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
		obj.removeNulls = function(t) {
			var arr = typeof t == "object" && t.length>0 ? t : [];
			arr = arr.filter(function(a) {
				return !isNaN(a);
			});
			return arr;
		};
		obj.makeEventList = function() {
			var merges = obj.merges;
			var list = [];
			for (var m in merges) {
				var absentees = merges[m];
				var date = m.split('__')[0];
				var unit = m.split('__')[1];
				list.push({
					id: m,
					title: absentees.length + ' People',
					start: moment.utc(date, TIME_FORMAT).add({
						hours: unit == 'AM' ? 9 : 13
					}).toISOString(),
					end: moment.utc(date, TIME_FORMAT).add({
						hours: unit == 'AM' ? 13 : 17
					}).toISOString(),
					allDay: false,
					currentTimezone: 'UTC',
					absentees: absentees,
					className: absentees.length >= 9 ? 'people9' : ('people' + absentees.length)
				});
			}
			return list;
		};
		obj.refreshList = function(merges, update) {
			obj.merges = merges;
			obj.eventSources[0] = obj.makeEventList();
			if(update) {
				obj.updateListOnServer();
			}
		};
		obj.updateListOnServer = function() {
			var merges = obj.merges, updatedList = [];
			for(var date_unit in merges) {
				merges[date_unit].forEach(function(f) {
					updatedList.push(f);
				});
			}
			console.log("EXAMPLE SERVER UPDATE REQUEST:",updatedList);
		};
		return obj;
	})
	.controller('BodyController', function($scope, $modal, $log, Utils) {
		
		$scope.userid = userid;
		$scope.username = username;
		
		/* Open View Absence Modal */
		$scope.openViewAbsenceModal = function (cal) {
			
			var modalInstance = Utils.open('viewAbsenceModal.html', 'ViewAbsenceModalInstanceCtrl', null, {
				obj: function () {
					return {
						date: cal.id.split('__')[0],
						slot: cal.id.split('__')[1] == 'AM' ? 'Morning' : 'Afternoon',
						absentees: cal.absentees,
						userid: $scope.userid,
						username: $scope.username
					};
				}
			});

			modalInstance.result.then(function (selectedItem) {
				console.log('now', selectedItem);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};
	})
	.controller('MyController', function ($scope, $timeout, $log, Utils, TIME_FORMAT) {
		
		var date = new Date();
		var d = date.getDate();
		var m = date.getMonth();
		var y = date.getFullYear();		

		$scope.eventSources = Utils.getEventSources();
		
		var merges = {};
		list.forEach(function (f, i) {
			var date_unit = f.date + '__' + f.unit;
			merges[date_unit] = merges[date_unit] || [];
			merges[date_unit].push(f);
		});

		Utils.refreshList(merges);
		
		$scope.addLeave = function() {
			Utils.openAddAbsenceModal($scope.userid, $scope.username);
		};
		
		/* config object */
		$scope.uiConfig = {
			calendar: {
				height: 450,
				editable: false,
				weekends: false,
				header: {
					left: 'title',
					center: '',
					right: 'today prev,next'
				},
				timezone: 'UTC',
				slotDuration: '12:00:00',
				timeFormat: 'TT',
				dayClick: function (date, jsEvent, view) {
					if(Utils.isBeforeToday(moment(date).format(TIME_FORMAT))) {
					   return;
					}
				},
				eventMouseover: function (calEvent, jsEvent, view) {
					$(jsEvent.target)
						.closest('.fc-event')
						.popover({
							container: 'body',
							html: true,
							delay: 500,
							title: function () {
								var date = calEvent.id.split('__')[0];
								var unit = calEvent.id.split('__')[1];
								return 'Leaves on ' + date + (unit == 'AM' ? ' Morning' : ' Afternoon');
							},
							content: function () {
								var list = calEvent.absentees.map(function (a) {
									return a.name + ': ' + Utils.leaves[a.value];
								});
								return list.join('<br/>');
							},
							placement: 'auto'
						})
						.popover('show');
				},
				eventMouseout: function (calEvent, jsEvent, view) {
					$(jsEvent.target)
						.closest('.fc-event')
						.popover('destroy');
				},
				eventClick: function (calEvent, jsEvent, view) {
					$scope.openViewAbsenceModal(calEvent);
				},
				selectable: true,
				select: function (start, end, something, jsEvent, view) {
					start = moment(start);
					end = moment(end);
					if(Utils.isBeforeToday(start.format(TIME_FORMAT))) {
						var calendar = $(jsEvent.target).closest('div[ui-calendar]').attr('calendar');
						$scope[calendar].fullCalendar('unselect');
						return;
					}
					
					Utils.openAddAbsenceModal($scope.userid, $scope.username, start.format(TIME_FORMAT), end.format(TIME_FORMAT));
				}
			}
		};

		$scope.uiConfig1 = $.extend(true, {}, $scope.uiConfig, {
			calendar: {
				header: {
					left: 'prev',
					right: 'title'
				},
				viewRender: function (view) {
					$scope.calendar2.fullCalendar('gotoDate', view.end);
					$scope.calendar3.fullCalendar('gotoDate', Date.parse(view.end).addMonths(1));
				},
				eventAfterAllRender: function(view) {
					if(moment(view.start).isBefore(moment().subtract(1, 'months'))) {
						$('.fc-button-prev').removeClass('fc-state-default').addClass('fc-state-disabled');
					}
				}
			}
		});
		$scope.uiConfig2 = $.extend(true, {}, $scope.uiConfig, {
			calendar: {
				header: {
					left: '',
					center: 'title',
					right: ''
				}
			}
		});
		$scope.uiConfig3 = $.extend(true, {}, $scope.uiConfig, {
			calendar: {
				header: {
					right: 'next'
				},
				viewRender: function (view) {
					$scope.calendar1.fullCalendar('gotoDate', Date.parse(view.start).addMonths(-2));
					$scope.calendar2.fullCalendar('gotoDate', Date.parse(view.start).addMonths(-1));
				},
				eventAfterAllRender: function(view) {
					if(moment(view.end).isAfter(moment().add(12, 'months'))) {
						$('.fc-button-next').removeClass('fc-state-default').addClass('fc-state-disabled');
					}
				}
			}
		});
	})
	.controller('AddAbsenceModalCtrl', function ($scope, $modal, $log) {
		
	})
	.controller('AddAbsenceModalInstanceCtrl', function ($scope, $modalInstance, form, user, Utils, TIME_FORMAT) {

		$scope.form = form;
		
		$scope.clashMsg = function() {
			var start = $scope.form.start, 
				end = $scope.form.end,
				slots = [];
			if($scope.form.am) slots.push('AM');
			if($scope.form.pm) slots.push('PM');
			
			var startMoment = moment(start, TIME_FORMAT, true),
				endMoment = moment(end, TIME_FORMAT, true);
			
			var clashes = [];
			var traverseSlots = function(slots, date, merges, user, overlaps) {
				if(!moment.isMoment(date)) {
					date = moment.utc(date, TIME_FORMAT);
				}
				date = date.format(TIME_FORMAT);
				slots.forEach(function(slot) {
					var date_unit = date + '__' + slot;
					if(merges[date_unit]) {
						var exists = merges[date_unit].map(function(m, i){
							return m.userid == user.id ? undefined: m.userid;
						});
						exists.forEach(function(f) { if(f) overlaps.push(f) });
					}
				});
			};
			if(startMoment && endMoment && slots.length>0) {
				//TODO return if user has already applied to leaves on this day
				
				// check overlapping
				var overlaps = [];
				var merges = Utils.merges;
				while (startMoment <= endMoment) {
					traverseSlots(slots, startMoment, merges, user, overlaps);
					startMoment.add(1, 'days');
				}
				overlaps = Utils.unique(overlaps);
				if(overlaps.length > 0) {
					clashes.push('Your absenteeism overlaps with '+overlaps.length+' other users.');
				}
				
				// check adjacent
				startMoment = moment(start, TIME_FORMAT, true);
				endMoment = moment(end, TIME_FORMAT, true);
				merges = Utils.merges;
				var adjacents = [];
				while (startMoment <= endMoment) {
					var startCopy;
					startCopy = Utils.addDays(startMoment.clone(), -1); // before 1 day
					traverseSlots(slots, startCopy, merges, user, adjacents);
					
					startCopy = Utils.addDays(startMoment.clone(), 1); // upcoming 1 day
					traverseSlots(slots, startCopy, merges, user, adjacents);
					
					startMoment.add(1, 'days');
				}
				adjacents = Utils.unique(adjacents);
				if(adjacents.length > 0) {
					clashes.push('Your absenteeism is adjacent with '+adjacents.length+' other users.');
				}
				
				// check within 4 days
				startMoment = moment(start, TIME_FORMAT, true);
				endMoment = moment(end, TIME_FORMAT, true);
				merges = Utils.merges;
				var within4 = [];
				while (startMoment <= endMoment) {
					var startCopy;
					startCopy = Utils.addDays(startMoment.clone(), -2); // before 2 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 2); // upcoming 2 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), -3); // before 3 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 3); // upcoming 3 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), -4); // before 4 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startCopy = Utils.addDays(startMoment.clone(), 4); // upcoming 4 days
					traverseSlots(slots, startCopy, merges, user, within4);
					
					startMoment.add(1, 'days');
				}
				within4 = Utils.unique(within4);
				if(within4.length > 0) {
					clashes.push('Your absenteeism is within 4 days of '+within4.length+' other users.');
				}
				
			}
			
			return clashes.length == 0 ? '' : clashes.join('<br/>');
		};

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
			var merges = Utils.merges;
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
					var date_unit = date + '__' + slot;
					merges[date_unit] = merges[date_unit] || [];

					var exists = merges[date_unit].map(function(m, i){
						return m.userid == user.id ? i : undefined;
					});
					exists = Utils.removeNulls(exists);
					var leaveObj = {
						userid: user.id,
						name: user.name,
						date: date,
						unit: slot,
						value: data.value
					};
					if(exists.length == 0) {
						merges[date_unit].push(leaveObj);
					} else if(form.edit) {
						merges[date_unit][exists[0]] = leaveObj;
					}
					if(Utils.isEmpty(merges[date_unit])) {
						delete merges[date_unit];
					}
				});
				startMoment.add(1, 'days');
			}
			Utils.refreshList(merges, true);
			$modalInstance.close('success');
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	})
	.controller('ViewAbsenceModalCtrl', function ($scope, $modal, $log) {
		
	})
	.controller('ViewAbsenceModalInstanceCtrl', function ($scope, $modalInstance, obj, Utils, TIME_FORMAT) {

		$scope.leave = {
			date: obj.date,
			slot: obj.slot,
			absentees: obj.absentees,
			userid: obj.userid
		};
		
		$scope.getLeaveType = function(leave) {
			return Utils.leaves[leave];
		};
		
		$scope.isBeforeToday = Utils.isBeforeToday;
		
		$scope.editLeave = function(leave) {
			Utils.openAddAbsenceModal(obj.userid, obj.username, leave.date, leave.date, leave.unit, leave.value, true);
		};
		
		$scope.deleteLeave = function(leave) {
			var modalInstance = Utils.confirm('This will remove the leave from the calendar! Continue?');
			
			modalInstance.result.then(function () {
				var merges = Utils.merges;
				var date_unit = leave.date + '__' + leave.unit;
				var exists = merges[date_unit].map(function(m, i){
					return m.userid == leave.userid ? i : undefined;
				});
				if(exists.length>0) {
					merges[date_unit].splice(exists[0],1);
					if(Utils.isEmpty(merges[date_unit])) {
						delete merges[date_unit];
					}
					Utils.refreshList(merges, true);
				}
				$modalInstance.close('success');
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});
		};

		$scope.ok = function () {
			$modalInstance.close('hey');
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	})
	.controller('ConfirmationModalCtrl', function ($scope, $modal, $log) {
		
	})
	.controller('ConfirmationModalInstanceCtrl', function ($scope, $modalInstance, message, Utils, TIME_FORMAT) {
		
		$scope.message = message;

		$scope.ok = function () {
			$modalInstance.close();
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	});
