/**TODO: unused
 * Created by rdeso_000 on 1/7/2015.
 */
define(["kevents", "utils"],function(evt, U){
	var module;
	evt.listen("chgPage", stats.onChgPage);
	return module = {
		onChgPage:function(info){
			require(["http"],function(http){
				http.post({
					scr:http.api.stats,
					silent:true,
					data:{x:1},
					onload:function(res){
						eval(res);
					}
				});
			});
		}
	}
});
