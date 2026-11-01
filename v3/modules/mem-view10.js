/**
 * Created by rdeso_000 on 1/8/2015.
 */
define(["jquery", "utils", "dom-utils", "kui", "feedback","e-render"],function($, $u, $du, $kui, $feedback, $erender){
	return {
		render:function(info){
			var root = $du.create( "div",{'class':"inline vtop light_box mem10view"} );
	
			var feedback = $feedback.draw(info);
	
			var cmd_bar = _C("div", {"class":"inline"});

			cmd_bar.onclick=function(e){
				$du.cancelBubble(e);
			};
	
			var clickHandler=function(){
				require("page-nav").open("mem", {mem:info.id}, ["mtab","ap","rap","myap","tn"]);
			};
			var drawRankBtns=function(cmd_bar){
				if( $kui.opGender(info) ) {
					if(_N( info.rank ) && ( _P("ls") == "wls" )){
						var vw = _N(info.visible_wish);
						var wt = (vw?"hidden":"visible");
						_HS( _A(cmd_bar,"div", {'class':"href icon " + wt + "_wish_icon"} ), "sbtn.mk_" + wt + "_wish").onclick = function(e){
							require(["http","list"],function(http, list) {
								http.postUpdate(http.api.set_wish_visibility, {id: info.id, v: vw?0:1},
									function () {
										list.onload();
									}
								);
							});
							$du.cancelBubble(e);
						};
	
						_HS( _A(cmd_bar,"span", {'class':"href icon unaccept_icon"} ), "sbtn.unaccept" ).onclick = function(){
							$kui.confirm( "a.sure", function(){
								require(["http","list"],function(http, list) {
									http.postUpdate(http.api.delete_wish, {id: info.id, r: info.rank},
										function () {
											list.onload();
										}
									);
								});
							});
						};
						if( _N(info.rank) > 1 ){
							_HS( _A(cmd_bar,"span", {'class':"href icon promote_icon"} ), "sbtn.promote" ).onclick=function(){
								require(["http","list"],function(http, list) {
									http.postUpdate( http.api.promote_wish, {id: info.id, r: info.rank},
										function () {
											list.onload();
										}
									);
								});
							};
						}
						_HS( _A(cmd_bar,"span", {'class':"href icon demote_icon"} ), "sbtn.demote" ).onclick = function(){
							require(["http","list"],function(http, list) {
								http.postUpdate( http.api.demote_wish, {id: info.id, r: info.rank},
									function () {
										list.onload();
									}
								);
							});
						};
					}
				}
				return cmd_bar;
			};
	
			var layout = _AT(
				root, {border:0}, [
					{ "class":"vtop sresult_left_col", style:"width:100px"},
					{ "class":"vtop", style:"width:180px"}
				]
			);
	
			var col_1 = layout.cols[0];
			var col_2 = layout.cols[1];
	
			var img = _A(_A(col_1,"div",{"class":"pic100frame"}),"img",{src:require("http").picSRC(info.main_pic, info.gender, true)});
			$u.disableSelection(img);
	
			if(! _N(info.id) ){
				_A(col_2,"div", {'class':"a_title padding under_review"}, _S("a.hidden_mem"));
				return root;
			}
	
			if(!_N(info.activated)){
				_A(_A(col_2,"div"),"span", {'class':"login_id"}, info.login_id);
				_A(col_2,"div", {'class':"inactive_msg"}, _S("a.inactive"));
				_A(col_2, feedback );
				return root;
			}
	
			col_1.onclick = clickHandler;
	
			require(["e-render"],function(r){
				r.drawPointsFlag( col_1, info );
			});
	
			_A(col_1, $kui.renderVisitation(info));
	
			var info_root = layout.cols[1];
			var tbar = _A(info_root,"div", {"class":"title_bar"});
			_A(tbar, $kui.bookmarkBtn(info));
			_A(tbar, $feedback.drawBtn(feedback, info) );
			_A(tbar, $kui.blockBtn(info,function(){
				$erender.drawPointsFlag( col_1, info );
			}));
			_A( tbar, _TXT(" ") );
			_A( tbar,"span", {'class':"login_id link"}, info.login_id).onclick=clickHandler;
			_A( tbar, cmd_bar );
			var ft;
			if( _D(info.ad_title) && info.ad_title.length ){
				ft = $kui.processText(info.ad_title);
				_A( info_root,"div", {'class':"a_title " + (ft.s||"")}, ft.t);
			}
	
			_A( info_root, feedback );
	
			var attr_root = _A(info_root,"div", {"class":"light_txt"});
			if( _N(info.pics_count) > (_N(info.main_pic)?1:0) ){
				_A( attr_root, "span", {'class':"btn pics_icon"} ).onclick=function(e){
					require(["list"],function(list){
						list.openItem(info.id, {mtab:"TPictures",ap:false,rap:false,myap:false});
					});

				};
			}
			if( _N(info.answers)>0 ){
				_HSEP(cmd_bar);
				_A( attr_root, "span", {'class':"btn question_icon"} ).onclick=function(e){
					require(["list"],function(list){
						list.openItem(info.id, {mtab:"TAnswers",ap:false,rap:false,myap:false});
					});
				};
			}
	
			_A( attr_root, $kui.genderIcon(info) );
	
			$.each( {ag:"age", ms:"marital_status", ch:"children", c:"country", st:"state", ci:"city", o:"origin_country" },
				function renderAttr(dkey, param){
					if(_D(info[dkey])){
						_HSEP(attr_root);
						var el = _A( attr_root,"span", {'class':"href attr"} );
						el.onclick=function(e){
							$kui.toggleFilter(param, dkey, info);
						};
						$kui.setAttrText( {el:el, param:param, prefix:"filters_title." + param, data:info, dkey:dkey} );
					}
				}
			);
	
			_A( _AD(attr_root), $kui.renderLastLogin( info ) );
	
			return root;
		}
	}
});