/*!
 * ${copyright}
 */
sap.ui.define([
	"sap/ui/core/sample/odata/v4/SalesOrders/tests/CreateRelative",
	"sap/ui/test/opaQunit"
], function (CreateRelativeTest, opaTest) {
	/*global QUnit */
	"use strict";

	QUnit.module("sap.ui.core.sample.odata.v4.SalesOrders - Create Relative");

	//*****************************************************************************
	opaTest("Create, modify and delete within relative listbinding", function (Given, When, Then) {

		CreateRelativeTest.createRelative(Given, When, Then);

	});
});