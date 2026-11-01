/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["jquery","kevents","utils","js-promise"], function($, $evt, $u, CPromise){
	var $du;
	return $du = {
		waitFor$:function(css, root, waitTimeout, interval){
			var waitTime = 0;
			waitTimeout = waitTimeout || 30000; // 30 seconds default wait time
			interval = interval || 500;
			return new CPromise(function(onSuccess,onFailure){
				function check(){
					var $found =$(css, root);
					if( $found.dom()){
						onSuccess($found);
					}else{
						if( (waitTime+=interval) < waitTimeout ) {
							setTimeout(check, interval);
						}else{
							onFailure();
						}
					}
				}
				check();
			})
		},
		overflowCSS: function (el) {

			var qurhandle, cleanUp;

			var quOnResize = function () {
				$du.removeClass(el, "xscroll");
				el.title = "scrollWidth:" + el.scrollWidth + " ; offsetWidth:" + el.offsetWidth;
				if (( el.scrollWidth - el.offsetWidth) > 10) {
					$du.addClass(el, "xscroll");
				} else {
					$du.removeClass(el, "xscroll");
				}
				qurhandle = null;
			};

			var onResize = function () {
				if (!el.baseURI) {
					setTimeout(cleanUp, 10);
					return;
				}

				if (qurhandle) {
					clearTimeout(qurhandle);
				}
				qurhandle = setTimeout(quOnResize, 100);
			};

			var openMenu = function () {
				$du.addClass(el, "show_menu");
				$du.waitForOutClick().done(function () {
					$du.removeClass(el, "show_menu");
				});
			};

			$evt.listen("resizeWindow", onResize, el);

			$(".menu_button", el).click(openMenu);

			cleanUp = function () {
				$evt.removeListener("resizeWindow", el);
				//el.removeEventListener("click", openMenu);
			};

			setTimeout(onResize, 10);
		},
		//initHScroller: function (el) {
		//	var lBtn = _AD(el, {"class": "left_scroll_btn"});
		//	var rBtn = _AD(el, {"class": "right_scroll_btn"});
		//	var lBtnClick = function () {
		//		el.scrollLeft = "0px";
		//	};
		//	var rBtnClick = function () {
		//		el.scrollRight = "0px";
		//	};
		//	lBtn.addEventListener("click", lBtnClick);
		//	rBtn.addEventListener("click", rBtnClick);
		//	var cleanUp = function () {
		//		$evt.removeListener("resizeWindow", el);
		//		lBtn.removeEventListener("click", lBtnClick);
		//		rBtn.removeEventListener("click", rBtnClick);
		//	};
		//	var onResize = function () {
		//		if (!el.baseURI) {
		//			setTimeout(cleanUp, 10);
		//		}
		//		if (el.scrollWidth > el.offsetWidth) {
		//			$du.addClass(el, "xoverflow");
		//		} else {
		//			$du.removeClass(el, "xoverflow");
		//		}
		//	};
		//
		//	$evt.listen("resizeWindow", onResize, el);
		//	setTimeout(onResize, 10);
		//},
		initTabs: function (el) {
			$(".tab_selector [data-tab]", el).click(function (e) {
				var sel_tab = e.target.getAttribute("data-tab");
				el.setAttribute("data-tab", sel_tab);
			});
		},
		waitForClick: function (options) {
			var pr = new CPromise();
			var clickHandler = function (e) {
				var target = e.target;
				if(options.exclude) {
					$exc = $(options.exclude);
					for (var i = 0; i < $exc.length; i++) {
						if (target == $exc[i]) {
							return;
						}
					}
				}
				pr.fulfill(true);
				document.body.removeEventListener("click", clickHandler);
			};
			setTimeout(function () {
				document.body.addEventListener("click", clickHandler);
			}, 1);

			return pr;
		},

		waitForOutClick: function (el) {
			var pr = new CPromise();
			el = _E(el);
			var clickHandler = function (e) {
				var target = e.target;
				if (!el || !$du.childOf(target, el)) {
					pr.fulfill(true);
					document.body.removeEventListener("click", clickHandler);
				}
			};
			setTimeout(function () {
				document.body.addEventListener("click", clickHandler);
			}, 1);

			return pr;
		},
		selectSibling: function (id) {
			var node = _E(id);
			if (!node) return this;
			var siblings = node.parentNode.childNodes;
			for (var i = siblings.length - 1; i >= 0; i--) {
				this.removeClass(siblings[i], "sel");
			}
			this.addClass(node, "sel");
			return this;
		},

		selectChild: function (root, child, qsiblings, cs) {
			cs = cs ? cs : "sel";
			$(qsiblings, root).each(function (el) {
				$du.removeClass(el, cs);
			});
			$du.addClass(child, cs);
		},
		//onWheel: function (el, handler) {
		//	var fn = function (e) {
		//		e = e || window.event;
		//		if (!_D(e.wheelDelta)) {
		//			e.wheelDelta = e.detail * (-100);
		//		}
		//		handler(e);
		//		return false;
		//	};
		//	if (el.addEventListener) {
		//		el.addEventListener("DOMMouseScroll", fn, false);
		//	} else if (el.attachEvent) {
		//		el.attachEvent("onmousewheel", fn);
		//	}
		//	el.onmousewheel = el.onmousewheel = fn;
		//},
		addEventListener: function (el, eventName, fn) {
			if (el.addEventListener) {
				el.addEventListener(eventName, fn);
			} else if (el.attachEvent) {
				el.attachEvent("on" + eventName, fn);
			} else {
				el["on" + eventName] = fn;
			}
		},
		removeEventListener: function (el, eventName, fn) {
			if (el.removeEventListner) {
				el.removeEventListener(eventName, fn);
			} else if (el.detachEvent) {
				el.detachEvent("on" + eventName, fn);
			} else {
				delete el["on" + eventName];
			}
		},
		//applyStyles: function (el, styles) {
		//	for (var attr in styles) {
		//		el.style[attr] = styles[attr]
		//	}
		//},
		bar: function (p) {/*{val:"",max:"",color:""}*/
			var d = _C("div", {"class": "anchor"});
			_AD(d, {
				"class": "absolute",
				style: "height:22px;width:" + (_N(p.val) / (p.max / 100)).toString() + "%;background:" + p.color
			});
			_AD(d, {"class": "absolute"}, _TXT(p.val));
			return d;
		},
		onKeyPress: function (el, handler) {
			var myHandler = function (e) {
				if (handler(e)) {
					$du.cancelBubble(e);
				}
			};
			if (el.addEventListener) {
				el.addEventListener("keypress", myHandler, false);
			} else if (el.attachEvent) {
				el.attachEvent("onkeypress", myHandler)
			} else {
				el.onkeypress = myHandler;
			}

		},
		findAttr: function (el, name) {
			var curr = el;
			while (curr) {
				if (_EA(curr, name)) {
					return curr;
				}
				curr = curr.parentNode;
			}
			return null;
		},
		findMethod: function (el, name) {
			var curr = el;
			while (curr) {
				if (_D(curr[name])) {
					return curr;
				}
				curr = curr.parentNode;
			}
			return null;
		},
		unblockPr: function (el) {
			el = _E(el);
			if (!el) {
				el = document.body;
			}
			if (el.pr) {
				_R(el.pr);
				delete el.pr;
			}
			return el;
		},
		blockPr: function (el) {
			el = _E(el);
			if (!el) {
				el = document.body;
			}
			if (el.pr) {
				return el.pr;
			}
			var root = el.pr = el.insertBefore(_C("div"), el.firstChild);
			var bl = _A(root, "div", {"class": "white_bg trans div_blocker"});
			var bl_br = _A(root, "div", {"class": "progress_bg div_blocker"});
			bl_br.style.width = bl.style.width = el.offsetWidth + "px";
			bl_br.style.height = bl.style.height = el.offsetHeight + "px";
			return root;
		},
		createFormInputs: function (form, inputs) {
			Enum(inputs, function (val, key) {
				_A(form, "input", {type: "hidden", name: key, value: val});
			});
			return form;
		},
		radioVal: function (r) {
			var val;
			Enum(r, function (item) {
				if (item.checked) {
					val = item.value;
				}
			});
			return val;
		},
		replace: function (el, newEl) {
			el = _E(el);
			newEl = _E(newEl);
			if (newEl == el) {
				return el;
			}
			if (el && el.parentNode) {
				el.parentNode.replaceChild(newEl, el);
				return newEl;
			}
			return el;
		},
		cancelBubble: function (e) {
			if (_D(e)) {
				e.cancelBubble = true;
				if (_D(e.stopPropagation)) {
					e.stopPropagation();
				}
			} else if (_D(event)) {
				event.cancelBubble = true;
			}
		},
		absPos: function (el) {//TODO: use getBoundingRectangle() instead
			var ret = {left: 0, top: 0};
			while (el) {
				ret.left += el.offsetLeft;
				ret.top += el.offsetTop;
				el = el.offsetParent;
			}
			return ret;
		},
		clear: function (el) {
			if (( el = _E(el) )) {
				el.innerHTML = "";
				if (el.pr) {
					delete el.pr;
				}
			}
			return el;
		},
		setAttr: function (el, attr) {
			if (( el = _E(el) )) {
				Enum(attr, function (val, key) {
					switch (key) {
						case "checked":
							el.checked = val;
							break;
						default:
							if (val == null) {
								el.removeAttribute(key);
							} else {
								el.setAttribute(key, val);
							}
					}
				});
			}
			return el;
		},

		create: function (sTag, attrs, contents) {
			sTag = sTag || "div";
			var el = document.createElement(sTag);
			this.setAttr(el, attrs);
			if (_D(contents)) {
				if ((typeof contents === "string") || (typeof contents === "number")) {
					el.innerHTML = contents;
				} else {
					this.append(el, contents);
				}
			}
			return el;
		},

		append: function (el, child, attrs, contents, bClear) {
			el = _E(el);
			if ($u.isArray(child)) {
				var ret = [];
				Enum(child, function (item) {
					ret.push($du.append(el, item));
				});
				return ret;
			}
			if (!el) {
				return undefined;
			}

			if (!child) {
				return undefined;
			}

			if (typeof child === "string") {
				child = this.create(child, attrs, contents);
			} else {
				this.setAttr(child, attrs);
				if (_D(contents)) {
					if ((typeof contents === "string") || (typeof contents === "number")) {
						child.innerHTML = contents;
					} else {
						child.appendChild(contents);
					}
				}
			}
			if (bClear === true) {//clear
				el.innerHTML = "";
			}
			return el.appendChild(child);
		},

		detach: function (el, parent) {
			el = _E(el);
			if (!el) {
				return null;
			}
			if (_D(parent)) {
				if (el.parentNode !== parent) {
					return child;
				}
			} else {
				parent = el.parentNode;
			}
			if (parent) {
				parent.removeChild(el);
			}
			return el;
		},
		appendTable: function (el, tableAttr, colAttr, rows_count) {
			el = _E(el);
			if (!el) {
				return null;
			}
			var layout = this.createTable(tableAttr, colAttr, rows_count);
			el.appendChild(layout.table);
			return layout;
		},

		createTable: function (tableAttr, colAttr, rows_count, rows_attr) {
			var ret = {rows: []};
			rows_count = _D(rows_count) ? rows_count : 1;
			ret.table = _C("table", tableAttr);
			ret.tbody = _A(ret.table, "tbody");
			ret.appendRow = function (cells_attr, row_attr) {
				return $du.appendTableRow(this.tbody, cells_attr || colAttr, row_attr);
			};
			for (var r = 0; r < rows_count; r++) {
				var cols = this.appendTableRow(ret.tbody, colAttr, rows_attr);
				ret.rows.push(cols);
			}
			ret.cols = ret.rows[0];
			return ret;
		},
		appendTableRow: function (tbody, colAttr, row_attr) {
			var tr = this.append(tbody, "tr", row_attr);
			var cols = [];
			for (var i = 0; i < colAttr.length; i++) {
				cols[i] = _A(tr, "td", colAttr[i]);
			}
			return cols;
		},
		setTableColWidth: function (tbl, col, width) {
			Enum(tbl.firstChild.childNodes, function (row) {
				row.childNodes[col].style.width = width.toString() + "px";
			});

		},
		hide: function (el) {
			if (el && el.constructor == String) {
				var aEl = el.split(",");
				for (var i = 0; i < aEl.length; i++) {
					this.hide(_E(aEl[i]));
				}
			} else if (el && el.constructor == Array) {
				for (var i = 0; i < el.length; i++) {
					this.hide(el[i]);
				}
			} else if (el && el.style) {
				el.style.display = "none";
			}
		},
		show: function (el) {
			if (el && el.constructor == String) {
				var aEl = el.split(",");
				for (var i = 0; i < aEl.length; i++) {
					this.show(_E(aEl[i]));
				}
			} else if (el && el.constructor == Array) {
				for (var i = 0; i < el.length; i++) {
					this.show(el[i]);
				}
			} else if (el) {
				el.style.display = "";
			}
		},
		//showHide: function (el) {
		//	el = _E(el);
		//	if (el.style.display == "none") {
		//		el.style.display = "";
		//	} else {
		//		el.style.display = "none";
		//	}
		//},
		addClass: function (el, cName) {
			el = _E(el);
			if (!el || !_D(cName)) {
				return false;
			}

			var classes = el.className.optimizeSpaces();
			if (!classes.length) {
				el.className = cName;
				return true;
			}

			var arr = classes.split(" ");

			if (!$u.arrFind(arr, cName)) {
				arr.push(cName);
				el.className = arr.join(" ");
				return true;
			}
			return false;
		},
		removeClass: function (el, cName) {
			el = _E(el);
			if (!el) {
				return false;
			}
			var arr = el.className.optimizeSpaces().split(" ");

			for (var i = 0; i < arr.length; i++) {
				if (arr[i] == cName) {
					arr.splice(i, 1);// remove array item
					el.className = arr.join(" ");
					return true;
				}
			}
			return false;
		},
		findClass: function (el, cName) {
			el = _E(el);
			if (!el) {
				return false;
			}
			return $u.arrFind(el.className.split(" "), cName);
		},
		toggleClass: function (el, cName) {
			if (this.findClass(el, cName)) {
				this.removeClass(el, cName);
			} else {
				this.addClass(el, cName);
			}
		},
		childOf: function (oChild, oParent) {
			if (!oChild || !oParent)
				return false;
			if (oChild == oParent)
				return true;
			try {
				var pn = oChild.parentNode;
				while (pn) {
					if (pn == oParent)
						return true;

					pn = pn.parentNode;
				}
			}
			catch (e) {
			}
			return false;
		},

		initMenuDock: function (el) {
			var handle = _AD(el, {"class": "dock_handle"});
			$evt.listen("scrollWindow", function (info) {
				if (info.scrollY > el.offsetTop) {
					$du.addClass(el, "scrolled");
					//$(el,".dock_handle").setHTML(info.scrollY);
				} else {
					$du.removeClass(el, "scrolled");
					//$(el,".dock_handle").setHTML("**");
				}

			}, el);

			handle.addEventListener("click", function (e) {
				$du.addClass(el, "show_menu");
				$du.waitForOutClick().done(function () {
					$du.removeClass(el, "show_menu");
				});
			});
			return el;
		},

		initMenuBtn: function (el, $d) {
			var $mBtn =$(".brgr_menu",el);
			if(!$mBtn.dom()){
				$mBtn = $(el);
			}
			var $mBtnParent=$mBtn.parent();
			var menuID = $mBtn.attr("data-menu") || ".menu";
			var submenuID = $mBtn.attr("data-submenu");
			var $menu;
			function findMenu(){
				$menu = $(menuID, $mBtnParent);//search for sibling menu
				if($menu.dom()){
					return true;
				}
				var $newParent =$mBtnParent.parent();
				if($newParent.dom()){
					$mBtnParent = $newParent;
					return findMenu();
				}
				return false;
			}
			if(!findMenu()){
				//create sibling menu
				$menu = $("<ul class='hmenu menu popup_list'>");
				menuID = ".menu";
				$mBtn.addAfter($menu);
			}
			$mBtn.click( function (e) {
				var $popup = $(menuID, $mBtnParent);
				if( $popup.hasClass("show_menu") ){
					$popup.removeClass("show_menu");
				}else {
					$popup.addClass("show_menu");
					setTimeout(function(){
						$popup.addClass("slide-in");
					},1);
					CPromise.any([
						$du.waitForClick({exclude:submenuID}),
						$evt.waitFor("chgPage")
					]).done(function () {
						$popup.removeClass("show_menu slide-in");
					});
				}
			});
			return $menu;
		},
		createLink:function(p){
			var att = $u.clone(p.att);
			att["class"] = att["class"]?att["class"]+" href" : "href";
			var el = _C( (p.tg||"span"), att );
			_HS(el,p.t);
			el.onclick=function(){
				require(["page-nav"],function(pgNav){
					pgNav.open(p.pg, p.p, p.dp, p.replace);
				});
			};
			return el;
		}

	};
});
