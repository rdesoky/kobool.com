/**
 * Created by rdeso_000 on 1/7/2015.
 */
define(["jquery", "kevents", "utils"],function($, evt, U){

	var ts = 0;
	return {
		init:function(){
			evt.listen("chgPage", function(info){
				if( U.arrFind( ["list","mem","drill","declines","qa","my_recent_questions","my_q_by_member","svd_srch"], info.pg) ){
					_SH("RightSide");
					var t = _T();
					if( (t-ts)>(1*60*1000) ){
						ts=t;
						var $rightPanel = $( "#RightSideContents" );

						require(["http","k-template"],function(http,tmpl){
							http.getCGI( http.api.featured, { "t": t } )
								.done( function( response ){
									var res = JSN(response.responseText);

									tmpl.getTemplate( ".featured_mem" )
										.done(function(template){
											if(res.child_list){
												$rightPanel.html("<div class='featured_title'>" + _S("a.featured") + "</div>")
												$rightPanel.append(template(res.child_list));
											}
										});
								});
						});
					}
				}else{
					_HI("RightSide");
				}
			});
		}
	};
});
