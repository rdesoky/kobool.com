/**
 * Created by rdeso_000 on 1/15/2015.
 */
define(["jquery","top-tabs", "page-nav", "str-loader","kui","cpoints"],function($,$tabs, $pgNav, $strLoader, $kui,$cpoints) {

	return {
		requireStrings:["cpoints:methods"],
		onload: function (root) {
			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.buy");
			$strLoader.requireStrings("cpoints:ui");

			//var root = $cpoints.renderLayout({root: "Contents", title: "cpoints:methods.page_title", bodyWidth: 740});
			$(root).html(
				'<div class="pg_header title">' + _S("cpoints:methods.page_title") + '</div>'
			);

			var lst = _A(_A(root,"div",{"class":"center_align"}), "ol", {id: "PaymentMethods"});
			$cpoints.renderMethods({root: lst});
		}
	};
});
