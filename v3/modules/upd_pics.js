/**
 * Created by rdeso_000 on 1/20/2015.
 */
define(["jquery", "top-tabs", "page-nav", "http", "kui", "check-frame", "dom-utils", "mem-ui"],function($, $tabs, $pgNav, $http, $kui, CCheckFrame, $du, $imem) {
	var module;
	return module = {
		requireCSS:["mem"],
		requireStrings:["pics:pics", "pics:select_matched_pics_visibility"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			$tabs.showTab("Menu.Update");
			$tabs.select("Update.pics");

			$("#DonePics").click(function(){
				$pgNav.open(_P("wz") ? "mem" : "update", {mem: false});
			});

			document.forms.uploader.onsubmit = function () {
				document.forms.uploader.submt.disabled = true;
			};

			document.forms.uploader.filename.onchange = function () {
				document.forms.uploader.submt.disabled = false;
			};
			$("#PrivacyEditor input").click(function(e){
				var $opt = $(e.target);
				$http.postCGI($http.api.set_pic_visibility, {v: $opt.attr("value")}, function (t, x) {
					var r = $http.xml2JS(x);
					$("#PrivacyHelp").html( _S("pics:pics.visibility_help.v" + r.visibility) );
				});
			});
			this.showAlbum();

			window.UpdatePics = {
				uploadDone: function (response) {// called from iframe
					switch (response.status) {
						case "ok_def":
							SSN.main_pic = _N(response.pid);
							_SA("ProfilePic", {src: $http.picSRC(SSN.main_pic, SSN.gender, true)});
						case "ok":
							module.selectAfterUpload = response.pid != null ? _N(response.pid) : null;
							module.showAlbum();
							break;
						default:
							alert(response.status);
					}
					if (response.status == "ok_def" || response.status == "ok") {
						document.forms.uploader.reset();
						document.forms.uploader.submt.disabled = true;
					} else {
						document.forms.uploader.submt.disabled = false;
					}
				}
			};

		},
		showAlbum: function () {
			var $tn_frame = $("#AlbumEditor .tn_frame");
			var $tbar = $("#PicToolbar");
			var $pic_frame = $("#ImageViewer");
			var selectAfterUpload = module.selectAfterUpload;
			module.selectAfterUpload = null;

			$pic_frame.html("");
			$tbar.html("");

			$http.post({
				scr: $http.api.pics,
				data: {id: _N(_GC("id"))},
				onload: function (t, x) {
					var r = x ? $http.xml2JS(x) : JSN(t);
					$tn_frame.html("");

					$("#Vis" + r.visibility).dom().checked = true;
					$("#PrivacyHelp").html( _S("pics:pics.visibility_help.v" + r.visibility) );

					( r.child_list && r.child_list.length ) ? _SH("AlbumEditor") : _HI("AlbumEditor");

					var $selectImg = null;
					$.each(r.child_list, function (item) {
						var $img = $("<img>").attr("src",$http.picSRC(item.id, SSN.gender, true)).addClass("tn_frame_pic");

						if (selectAfterUpload != null && item.id == selectAfterUpload) {
							$selectImg = $img;
						}

						$tn_frame.append($img);

						$img.click( function (e) {
							var img = e.target;

							$du.selectSibling(img);

							$tbar.html("");

							if( img != $tn_frame.dom().firstChild ){
								var $btnMoveTop=$("<span>").addClass("icon16 icon16-top").attr("tip","help:pics.move_top");
								$tbar.append($btnMoveTop);
								$btnMoveTop.click(function(){
									$http.postCGI($http.api.set_top_pic, {id: item.id}, function () {
										module.showAlbum();
									});
								});
							}

							if (_N(item.active) != 5 && _N(item.active) != 1) {
								var $btnSetMain=$("<span>").addClass("icon16 icon16-profile");
								$tbar.append($btnSetMain);

								function setBtnTip(){
									$btnSetMain.attr("tip","help:pics." + ((item.id == SSN.main_pic) ? "cancel_main" : "set_main"));
								}
								setBtnTip();

								$btnSetMain.click( function () {
									var pic_id = (item.id == SSN.main_pic ? 0 : item.id);
									$http.postCGI($http.api.set_main_pic,
										{id: SSN.id, pid: pic_id},
										function (t, x) {
											SSN.main_pic = pic_id;
											$("#ProfilePic").attr("src",$http.picSRC(pic_id, SSN.gender, true));
											setBtnTip();
										}
									);
								});
							}

							var $btnDelete=$("<span>").addClass("icon16 icon16-delete").attr("tip","help:pics.delete");
							$tbar.append($btnDelete);
							$btnDelete.click( function (e) {
								require(["popup"], function (popup) {
									popup.open("confirm", undefined, "pics:pics.confirm_delete", [
										{
											title: _S("a.yes"),
											onclick: function () {
												$http.postCGI($http.api.del_pic,
													{id: item.id},
													function (res) {
														if (item.id == SSN.main_pic) {
															$imem.refreshHeader(true);
														}
														module.showAlbum();
													}
												);
											}
										},
										{
											title: _S("a.no"),
											focus: true
										}
									]);
								});
							});

							var ps = {"0": "under_review", "1": "rejected", "5": "cant_be_main"}[item.active];
							if (ps) {
								$tbarhelp = $("<span>").addClass("vtop small");
								_HS( $tbarhelp.dom(), "help:pics." + ps);
								$tbar.append($tbarhelp);
							}
							var $img_view = $("<img>").attr("src",$http.picSRC(item.id, SSN.gender)).addClass("mem_pic");
							$pic_frame.html("").append($img_view);
						});
					});

					if (selectAfterUpload !== undefined) {
						var $target = (selectAfterUpload != null && $selectImg) ? $selectImg : $tn_frame.children().first();
						if ($target.length) {
							$target.click();
						}
					}
				}
			});
		}
	};
});