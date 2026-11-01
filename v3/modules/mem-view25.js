/**
 * Created by rdeso_000 on 1/15/2015.
 */
define(["utils", "dom-utils", "kui", "http","e-render"],function($u, $du, $kui, $http, $erender){
	return {
		render:function(inf, open_params){
			var root = _C("div", {"class":"mem_thumb inline vtop"});
			var tbl = _AT(root,{cellspacing:0},[{"class":"gallery_pic"},{"class":"vtop"}]);
			var pic_frame = tbl.cols[0];
			var img = _A( pic_frame,"img",{src:$http.picSRC(inf.main_pic,inf.gender,true) } );
			$u.disableSelection(img);

			_A(tbl.cols[1],"div",{"class":"login_id"},inf.login_id);

			if(! _N(inf.id) ){
				_A(tbl.cols[1],"div", {'class':"padding under_review"}, _S("a.hidden_mem"));
				return root;
			}

			if(!_N(inf.activated)){
				_A(tbl.cols[1],"div",{"class":"attr"},_S("a.inactive"));
			}
			//root.ontooltip=function(){
			//	var tt = _C("div",{style:"min-width:260px;min-height:120px;"});
			//	require(["mem-view10"],function(viewer){
			//		_A(tt,viewer.render(inf, open_params));
			//	});
			//	return tt;
			//};
			root.onclick=function(){
				require("page-nav").open("mem", open_params ? $u.clone(open_params,{mem:inf.id}) : {mem:inf.id}, ["mtab","ap","rap","myap","tn"]);
			};

			$erender.drawPointsFlag( pic_frame, inf );

			if(_D(inf.age)){_A(tbl.cols[1],"div",{"class":"attr"},inf.age + " " + _S("a.year"));}
			if(_D(inf.country)){
				_HS( _A(tbl.cols[1],"div",{"class":"attr"}),"geo:c.v"+inf.country );
			}

			return root;
		}
	};
});
