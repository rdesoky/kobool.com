/**
 * Created by rdeso_000 on 2/15/2015.
 */
define([],function(){
	var time_left, check_time;
	return {
		init:function(){
			var self = this;
			require(["kevents"],function(kevents){
				time_left = _D(TMatching)?TMatching.time_left:undefined,
				check_time = _D(TMatching)?TMatching.check_time:undefined,
				kevents.listen("SecondTic", self.onSecondTic, self);
				self.onSecondTic();
			});
		},
		onSecondTic:function(){
			_A( _CL("MatchingTimer"), this.render() );
		},
		render:function(){
			var d=_C("a",{href:"#pg=matching"});
			function calcRS(){
				if( !_D(time_left) ){
					return undefined;
				}
				var now = Math.floor(_T()/1000);
				return (time_left - (now-check_time));
			}
			function showTimer(){
				var rs = calcRS();
				if( !_D(rs) ){
					return false;
				}
				while(rs<0){
					rs+=24*60*60;
				}
				if(rs>(24*60*60-60*10)){
					_HS(d, "a.matching_now" );
					return true;
				}
				var rh = Math.floor( rs / ( 60 * 60 ) );
				var rm = Math.floor( ( rs - rh * 60 * 60 ) /  60 ) + 1;
				rs = rs % 60;
				_H(d, _S("a.mtime") + " " + rh + ":" + rm + ":" + rs );
				return true;
			}

			if( !showTimer() ){
				require(["http"],function($http){
					$http.post({
						scr:$http.api.matching_time_left,
						silent:1,
						onload:function(res){
							var i=JSN(res);
							time_left = _N(i.seconds_left);
							check_time=Math.floor(_T()/1000);
							setVal();
						}
					});
				});
			}
			return d;
		}
	};
});