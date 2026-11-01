/**
 * Created by rdeso_000 on 1/14/2015.
 */
//TODO: obsolete
define(["jquery", "http","kui", "top-tabs", "page-nav", "utils","dom-utils", "kui", "qui", "data-viewer"],function($, $http, $kui, $tabs, $pgNav, $u, $du, $kui, $qui, CDataViewer){

	var module;

	return module = {
		onload:function(){
			if( !$kui.chkLogin({nav:true}) ){
				return;
			}
			$tabs.showTab("Menu.QA");
			$tabs.select("QA.my_q_by_member");

			var header = _A( "Contents", "div", {"class":"pg_header", id:"PgHeader"} );
			_A( "Contents", "div", {"class":"pg_body", id:"MyQByMemberBody"} );

			_A( header, "span", { "class":"button"}, _S("a.browse") ).onclick=function(){
				module.openBrowser();
			};


			this.onchange();
		},

		onchange:function(){
			if( _P("mem") ){
				//_SH("QBar");_HI("QBrowser");

				var pr = _R( $kui.blockedEl("PageRoot") );
				var root = _A( "MyQByMemberBody", "div", {}, pr );

				$http.getCGI( $http.api.answers4u,
					{ to:_P("mem"), p:_P("p",0), all:_P("all",0) },
					function(res){
						_H("Debug", res);
						_CL(root);//remove progress
						_SA(root,{id:"PageRoot"});
						var r = JSN(res);

						var openProfile = function(){
							$pgNav.open( "mem", {mem:r.to_member}, true );
						};

						var atr = _A(root,"div",{"class":"attr_bar"});
						r.id = r.to_member;
						_A( atr, [$kui.bookmarkBtn(r),_TXT(" ")] );
						_A( atr, "span", {"class":"login_id inline"}, r.login_id ).onclick=openProfile;
						_A( atr, $kui.genderIcon( r, {href:false} ) );
						if(r.activated){
							$kui.renderAttr( atr, r, {ag:"age", ms:"marital_status", ch:"children", c:"country", o:"origin_country" }, {href:false} );
						}else{
							_A( atr,"span", {}, _S("a.inactive") );
						}

						var table = $du.appendTable(root, {}, [{"class":"vtop"},{"class":"vtop"}]);
						_A(table.cols[0], module.renderMember(r)).onclick = openProfile;

						var list = table.cols[1];

						$.each(r.child_list, function(item){
							_A(list, $qui.renderAnswer(item, function(){
								$pgNav.open("my_recent_questions", {qid:item.question}, true);
							}));
						});
						_A(list, $kui.renderNav(r));
					}
				);

			}
		},
		renderMember:function(info){
			var root = _C("div", {"class":"inline vtop"});
			$u.disableSelection(
				_A( root, "img", {"class":"small_pic", src:$http.picSRC(info.main_pic, info.gender, true)} )
			);

			return root;
		},

		openBrowser:function(){

			require(["popup"],
				function(popup){
					popup.open(
						"AskedMemQViewer",
						undefined ,
						module.renderQMBrowser("AskedMemQViewer"),
						[],
						true
					);
				}
			);

			this.renderQMBrowser("AskedMemQViewer");
		},
		renderQMBrowser:function(vID){

			if( $http.cache[vID] ){
				return $http.cache[vID].render();
			}

			$http.cache[vID] = new CDataViewer({
				cgi: $http.api.my_questions_by_member,
				query: {},
				onclick:function(row, cinfo){
					if(cinfo.fld=="total_answers"){
						$pgNav.open( "mem", {mem:row.to_member, mtab:"TAnswers"}, true );
					}else{
						//$pgNav.open( "my_q_by_member", {mem:row.to_member, all:(cinfo.fld!="answer_count")?1:0},["p"]);
						$pgNav.open("mem",{mem:row.to_member,mtab:"TAnswers4U"},true);
						require("popup").close("AskedMemQViewer");
					}
				},
				col:{
					id:{fld:"to_member"},
					ico:{fld:"gender",title:"",width:"5%;text-align:center", render:function(row){
						var ret = _C("span",{"class":"pic25frame"});
						if(_N(row.activated)){
							var img = _A( ret, "img", { src:$http.picSRC( row.main_pic, row.gender, true) } ) ;
							$u.disableSelection(img);
						}
						return ret;
					}
					},
					login_id:{fld:"login_id",title:_S("a.login_id"), width:"50%"},
					asked:{fld:"asked_questions",title:_S("a.questions"),width:"12%"},
					answerd:{fld:"answer_count",title:_S("a.answers"),width:"13%"},
					total:{fld:"total_answers",title:_S("a.all_answers"),width:"20%"}
				},
				pageSize:5
			});
			return $http.cache[vID].render();
		}

	};
});