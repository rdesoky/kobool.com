/**
 * Created by rdeso_000 on 1/14/2015.
 */

define(["jquery","kui", "page-nav", "http", "top-tabs", "data-viewer", "dom-utils", "utils"],function($,$kui,$pgNav, $http, $tabs, CDataViewer, $du, $u){
	var module;
	return module = {
		requireCSS:["cpoints"],
		requireStrings:["cpoints:report","options:payment_channels","options:select_currency"],
		onload:function(){
			if( !$kui.chkLogin({nav:true}) ){
				return;
			}

			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.report");
			this.render();
		},
		render:function(){
			_HS( _A(_CL("Contents"),"div",{"class":"pg_header title"}), "cpoints:report.page_title");

			var root = _A( "Contents", "div", {"class":"pg_body"} );

			_A( root,"ul", {id:"CPReportActions","xclass":"text_view"}, "&nbsp;" );

			_A( _A(root, "div", {id:"PointsList"}),"div",{} , _S("cpoints:report.list_title") );

			if( $http.cache.allPoints ){
				this.onDataResponse( $http.cache.allPoints.data );
			}else{
				$http.cache.allPoints = new CDataViewer({
					cgi: $http.api.my_cards,
					query: {ps:10},
					onDataResponse:function(res){
						module.onDataResponse(res);
					},
					onclick:function(row, cinfo){
					},
					col:{
						id:{fld:"id"}
						,info:{
							fld:"date_purchased", title:_S("a.information"), width:"70%"
							,render:function(row){
								return $("<div class='point_info'>").append($("<div>").append(_S("cpoints:report.date_purchased") + ": ").append($u.SQL2LocaleDate(row.date_purchased)))
									.append($("<div>").append( row.date_used ? _S("cpoints:report.date_used") + ": " : "").append( row.date_used ? $u.SQL2LocaleDate(row.date_used) : _S("cpoints:report.usable")))
									.append($("<div>").append( _S("cpoints:report.channel") + ": ").append( _S("options:payment_channels.v"+row.channel)))
									.append($("<div>").append( _S("cpoints:report.price") + ": ").append( (_N(row.price) ? row.price + " " : "") + _S("options:select_currency.v"+row.currency)))
									.dom();
							}
						}
						//,date_purchased:{fld:"date_purchased", title:_S("cpoints:report.date_purchased"), width:200
						//	,render:function(row){
						//		return _TXT($u.SQL2LocaleDate(row.date_purchased));
						//	}
						//}
						//,date_used:{fld:"date_used", title:_S("cpoints:report.date_used"), width:200
						//	,render:function(row){
						//		return row.date_used ? _TXT($u.SQL2LocaleDate(row.date_used)) : _TXT("not used");
						//	}
						//}
						//,channel:{fld:"channel", title:_S("cpoints:report.channel"), width:100
						//	,render:function(row){
						//		return _HS(_C("span"), "options:payment_channels.v"+row.channel);
						//	}
						//}
						//,price:{fld:"price", title:_S("cpoints:report.price"), width:50}
						//,currency:{fld:"currency", title:_S("cpoints:report.currency"), width:100
						//	,render:function(row){
						//		return _HS(_C("span"), "options:select_currency.v"+row.currency);
						//	}
						//}
						,user:{fld:"user", title:_S("cpoints:report.usage"), width:"30%"
							,render:function(row){
								if(row.user){
									return $("<div class='pusage'>").addClass((row.user==SSN.id?"pusage_self":"pusage_mate"))
										.append("<div class='puser self'>" + SSN.login_id +"</div>" )
										.append("<div class='puser mate'>" + row.mate_login + "</div>")
										.dom();
								}else{
									return $("<span class='unused_point'>" + _S("cpoints:report.usable") + "</span>").dom();
								}
							}
						}
						//,mate_login:{fld:"mate_login"}
					}
				});
			}

			$http.cache.allPoints.render();
		},

		onDataResponse:function(res){
			var root = _CL("CPReportActions");

			if( _N( res.total) ){
				_A( root, "li", {}, _S("cpoints:report.usable_points") + " (" + res.total_usable + ")" );
				_A( "PointsList" , $http.cache.allPoints.render() );
			}else{
				_A( _CL("PointsList"), "li", undefined, _S("cpoints:report.no_points_found") );
			}

			var btns_bar = _A("CPReportActions", "li", {"class":"parag"});

			if( _N(res.refundable) ){
				_HS( _A( btns_bar, "span" ), "cpoints:ui.restore_points_prompt" );

				_HS( _A( btns_bar, "span", {"class":"button"} ),
					"cpoints:ui.restore_points"
				).onclick=function(){
					$kui.confirm("cpoints:confirm.unuse", function(){
						$http.postUpdate(
							$http.api.unuse_points,
							{match_id:SSN.mtid},
							function(res){
								module.render();
							}
						);
					});
				};

				btns_bar = _A("CPReportActions", "li", {"class":"parag"});
			}else if( SSN.mate && !res.need_card){// used at lease one point none-refundable
				_A( root, "li", {}, _S("cpoints:report.used_points") );
			}


			var usePoint=function(){
				var user = (_N(res.need_card)?"self":"mate");
				$kui.confirm("cpoints:confirm.use_point_" + user, function(){
					$http.postUpdate(
						$http.api.use_point,
						{user:user=="self"?SSN.id:SSN.mate},
						function(res){
							module.render();
						}
					);
				});
			};

			if( _N(res.need_card) || _N(res.mate_needs_card) ){
				if(_N(res.total_usable) ){
					if(_N(res.need_card)){
						_HS( _A( btns_bar, "span" ), "cpoints:ui.use_prompt" );
						_HS( _A( btns_bar, "span", {"class":"button"} ),
							"cpoints:ui.use"
						).onclick=usePoint;
					}else{
						_HS( _A( btns_bar, "span" ), "cpoints:ui.use4mate_prompt" );
						_HS( _A( btns_bar, "span", {"class":"button"} ),
							"cpoints:ui.use4mate"
						).onclick=usePoint;
					}
				}else{
					_HS( _A( btns_bar, "span" ), "cpoints:ui.buy_prompt" );
					_HS( _A( btns_bar, "span", {"class":"button"} ), "cpoints:ui.buy" ).onclick=function(){
						$pgNav.open("cp_buy");
					};
				}
			}else{
				_A( btns_bar, _HS( _C("span"), "cpoints:ui.not_needed" ) );
				btns_bar = _A("CPReportActions", "li", {"class":"parag"});
				_HS( _A( btns_bar, "span" ), "cpoints:ui.buy_extra_prompt" );
				_HS( _A( btns_bar, "span", {"class":"button"} ), "cpoints:ui.buy" ).onclick=function(){
					$pgNav.open("cp_buy");
				};
			}
		}
	}
});