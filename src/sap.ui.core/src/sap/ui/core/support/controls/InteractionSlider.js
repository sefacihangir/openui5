/*!
 * ${copyright}
 */

sap.ui.define(['jquery.sap.global', 'sap/ui/base/ManagedObject'],
    function (jQuery, ManagedObject) {
        'use strict';
        var InteractionSlider = ManagedObject.extend("sap.ui.core.support.controls.InteractionSlider", {
            constructor: function () {
                //this.SIDE_LIST_WIDTH = 250;
                this.SIDE_LIST_WIDTH = 0;
                this.LEFT_HANDLE_ID = 'left';
                this.RIGHT_HANDLE_ID = 'right';
                this.HANDLE_BORDER_SIZE = 1;
                this.HANDLES_WIDTH = 3;

                this.selectedInterval = {
                    start: 0,
                    end: 0
                };
                this.nodes = {
                    slider: null,
                    handle: null,
                    leftResizeHandle: null,
                    rightResizeHandle: null
                };
                this.sizes = {
                    width: 0,
                    handleWidth: 0,
                    handleMinWidth: 10
                };

                this.drag = {
                    handleClickOffsetX: 0,
                    handleOffsetLeft: 0,
                    isResize: false,
                    whichResizeHandle: ''
                };

                this.fRefs = {
                    mousedown: undefined,
                    mousemove: undefined,
                    mouseup: undefined,
                    dragstart: undefined
                };
            }
        });

        InteractionSlider.prototype.render = function(rm) {
            rm.write("<div id='interactionSlider'>" +
                "<div id='interactionSlideHandle'>" +
                "<span id='interactionLeftHandle'></span>" +
                "<span id='interactionRightHandle'></span>" +
                "</div>" +
                "</div>");
        };

        InteractionSlider.prototype.initialize = function () {
            this._registerEventListeners();
            this._initSlider();
        };

        InteractionSlider.prototype._registerEventListeners = function () {
            var that = this;
            window.addEventListener('resize', function () {
                that._calculateSliderSize();
            }, false);

            window.addEventListener('keydown', this._onArrowMove.bind(this));
            window.addEventListener('keyup', this._onArrowUp.bind(this));
            jQuery("#interactionSlideHandle").on('dblclick', this._initSlider.bind(this));
            jQuery("#interactionSlider").on('wheel', this._onMouseWheel.bind(this));
        };

        InteractionSlider.prototype._initSlider = function () {
            this.nodes.slider = this.nodes.slider || document.querySelector('#interactionSlider');
            this.nodes.handle = this.nodes.handle || document.querySelector('#interactionSlideHandle');
            this.nodes.leftResizeHandle = this.nodes.leftResizeHandle || document.querySelector('#interactionLeftHandle');
            this.nodes.rightResizeHandle = this.nodes.rightResizeHandle || document.querySelector('#interactionRightHandle');

            this.nodes.handle.style.left = 0;
            this.nodes.handle.style.width = '100%';

            //set the slider width
            this._calculateSliderSize();

            if (!this.fRefs.mousedown) {
                this.fRefs.mousedown = this._onMouseDown.bind(this);
                this.nodes.slider.addEventListener('mousedown', this.fRefs.mousedown);
            } else {
                this._fireSelectEvent();
            }
        };

        InteractionSlider.prototype._calculateSliderSize = function () {
            var oldSliderWidth = this.sizes.width;
            this.sizes.handleWidth = parseInt(this._getSlideHandleWidth(), 10);
            this.sizes.width = this.nodes.slider.offsetWidth;

            if (this.sizes.width !== this.sizes.handleWidth) {
                this._resizeSliderHandle(oldSliderWidth);
            }
            this._updateUI();
        };

        InteractionSlider.prototype._resizeSliderHandle = function (oldSliderWidth) {
            var sliderWidthDifference = this.sizes.width - oldSliderWidth;
            var upperWidthBound = this.sizes.width - this.drag.handleOffsetLeft;
            var newHandleWidth = this.sizes.handleWidth + sliderWidthDifference;

            this.sizes.handleWidth = Math.max(this.sizes.handleMinWidth, Math.min(newHandleWidth, upperWidthBound));
            this.nodes.handle.style.width = this.sizes.handleWidth + 'px';

            if (this.sizes.width < (this.drag.handleOffsetLeft + this.sizes.handleWidth)) {
                this.drag.handleOffsetLeft = this.sizes.width - this.sizes.handleWidth;
                this.nodes.handle.style.left = this.drag.handleOffsetLeft + 'px';
            }
        };

        InteractionSlider.prototype._updateUI = function () {
            this.sizes.handleWidth = parseInt(this._getSlideHandleWidth(), 10);
            this.drag.handleOffsetLeft = this.nodes.handle.offsetLeft;
        };

        InteractionSlider.prototype._getSlideHandleWidth = function () {
            var handleComputedWidth;
            if (document.getElementById("interactionSlideHandle").currentStyle) {
                handleComputedWidth = document.getElementById("interactionSlideHandle").currentStyle.width;
            } else {
                handleComputedWidth = window.getComputedStyle(this.nodes.handle).width;
            }
            return handleComputedWidth;
        };

        InteractionSlider.prototype._onArrowMove = function (evt) {
            var offsetLeft = 0;
            var STEP = 5;

            if (evt.keyCode != jQuery.sap.KeyCodes.ARROW_LEFT && evt.keyCode != jQuery.sap.KeyCodes.ARROW_RIGHT) {
                return;
            } else if (evt.keyCode == jQuery.sap.KeyCodes.ARROW_LEFT) {
                offsetLeft = -STEP;
            } else if (evt.keyCode == jQuery.sap.KeyCodes.ARROW_RIGHT) {
                offsetLeft = STEP;
            }
            var maxLeftOffset = Math.min((this.drag.handleOffsetLeft + offsetLeft),
                this.sizes.width - this.sizes.handleWidth);

            this.drag.handleOffsetLeft = Math.max(maxLeftOffset, 0);
            this.nodes.handle.style.left = this.drag.handleOffsetLeft + 'px';
        };

        InteractionSlider.prototype._onArrowUp = function (evt) {
            if (evt.keyCode != jQuery.sap.KeyCodes.ARROW_LEFT && evt.keyCode != jQuery.sap.KeyCodes.ARROW_RIGHT) {
                return;
            }
            this._fireSelectEvent();
        };

        InteractionSlider.prototype._onMouseDown = function (evt) {
            var targetId = evt.target.id;
            var marginAndHalfOfSlideHandleWidth = this.SIDE_LIST_WIDTH + (this.sizes.handleWidth / 2);
            var leftConstraint = Math.max(evt.clientX - marginAndHalfOfSlideHandleWidth, 0);
            var rightConstraint = this.sizes.width - this.sizes.handleWidth;
            var constrainedPosition = Math.min(leftConstraint, rightConstraint);

            if (targetId === this.nodes.slider.id) {
                this.nodes.handle.style.left = constrainedPosition + 'px';
                this.drag.handleOffsetLeft = this.nodes.handle.offsetLeft;
                this.drag.isResize = false;
            } else if (targetId === this.nodes.handle.id) {
                this.drag.handleClickOffsetX = evt.offsetX;
                this.drag.isResize = false;

                this._registerOnMouseMoveListener();
            } else if (targetId === this.nodes.leftResizeHandle.id) {
                this.drag.whichResizeHandle = this.LEFT_HANDLE_ID;
                this.drag.isResize = true;

                this._registerOnMouseMoveListener();
            } else if (targetId === this.nodes.rightResizeHandle.id) {
                this.drag.whichResizeHandle = this.RIGHT_HANDLE_ID;
                this.drag.isResize = true;

                this._registerOnMouseMoveListener();
            } else {
                return;
            }

            this._registerOnMouseUpListener();
            this._registerOnDragStartListener();
        };

        InteractionSlider.prototype._registerOnMouseMoveListener = function () {
            this.fRefs.mousemove = this._onMouseMove.bind(this);
            window.addEventListener('mousemove', this.fRefs.mousemove);
        };

        InteractionSlider.prototype._registerOnMouseUpListener = function () {
            this.fRefs.mouseup = this._onMouseUp.bind(this);
            window.addEventListener('mouseup', this.fRefs.mouseup);
        };

        InteractionSlider.prototype._registerOnDragStartListener = function () {
            this.fRefs.dragstart = this._onDragStart.bind(this);
            window.addEventListener('dragstart', this.fRefs.dragstart);
        };

        InteractionSlider.prototype._onMouseMove = function (evt) {
            evt.stopImmediatePropagation();

            var constraintDistance;
            var distance = evt.clientX - this.SIDE_LIST_WIDTH;
            if (this.drag.isResize) {
                this._handleResize(evt);
                return;
            }

            var rightBorder = this.sizes.width - this.sizes.handleWidth + this.drag.handleClickOffsetX;
            constraintDistance = Math.max(Math.min(distance, rightBorder), this.drag.handleClickOffsetX);
            this.nodes.handle.style.left = constraintDistance - this.drag.handleClickOffsetX + 'px';
        };

        InteractionSlider.prototype._onMouseWheel = function (evt) {
            evt.preventDefault();
            this._handleMouseWheelResize(evt);
        };

        InteractionSlider.prototype._handleResize = function (evt) {
            evt.stopImmediatePropagation();

            var minWidth;
            var maxWidth;
            var newWidth;
            var resizeDistance;
            var rightConstraint;
            var leftRightConstraints;
            var clientX = evt.clientX - this.SIDE_LIST_WIDTH;
            //var LEFT_DRAG_OFFSET_VALUE = 10;
            var DRAG_OFFSET_VALUE = 3;

            if (this.drag.whichResizeHandle === this.RIGHT_HANDLE_ID) {
                resizeDistance = clientX - this.drag.handleOffsetLeft + DRAG_OFFSET_VALUE;
                minWidth = Math.max(resizeDistance, this.sizes.handleMinWidth);
                maxWidth = this.sizes.width - this.drag.handleOffsetLeft;

                newWidth = Math.min(minWidth, maxWidth);
                this.nodes.handle.style.width = newWidth + 'px';
            }

            if (this.drag.whichResizeHandle === this.LEFT_HANDLE_ID) {
                minWidth = this.drag.handleOffsetLeft + this.sizes.handleWidth - this.sizes.handleMinWidth;
                clientX = Math.max(Math.min(clientX, minWidth), 0);
                maxWidth = this.drag.handleOffsetLeft + this.sizes.handleWidth;
                rightConstraint = Math.min(clientX, this.sizes.width);
                leftRightConstraints = Math.max(Math.max(rightConstraint, -2 * this.sizes.handleMinWidth),
                    DRAG_OFFSET_VALUE);
                newWidth = maxWidth - leftRightConstraints + DRAG_OFFSET_VALUE;

                if (newWidth <= DRAG_OFFSET_VALUE + this.sizes.handleMinWidth) {
                    newWidth -= DRAG_OFFSET_VALUE;
                    leftRightConstraints += DRAG_OFFSET_VALUE;
                }

                this.nodes.handle.style.left = (leftRightConstraints - DRAG_OFFSET_VALUE) + 'px';
                this.nodes.handle.style.width = newWidth + 'px';
            }
        };

        InteractionSlider.prototype._handleMouseWheelResize = function (evt) {
            var sizeChangeStep = 40;
            if (evt.originalEvent.deltaY && evt.originalEvent.deltaY >= 0) {
                this._calculateHandlerSizePositionOnMouseWheelDown(sizeChangeStep);
            } else {
                this._calculateHandlerSizePositionOnMouseWheelUp(sizeChangeStep);
            }
            this._updateUI();
            this._fireSelectEvent();
        };

        InteractionSlider.prototype._calculateHandlerSizePositionOnMouseWheelDown = function (sizeChangeStep) {
            var newLeftHandlerPosition;
            var newWidth;
            var rightHandlerMaxSizeLimit = this.sizes.width - this.drag.handleOffsetLeft;
            var widthIncrease = Math.min((rightHandlerMaxSizeLimit - this.sizes.handleWidth), sizeChangeStep);
            var rightHandlerInMaxRightPosition = (this.drag.handleOffsetLeft + this.sizes.handleWidth === this.sizes.width);

            if ((widthIncrease < sizeChangeStep) && !rightHandlerInMaxRightPosition) {
                newWidth = this.sizes.handleWidth + widthIncrease;
                newLeftHandlerPosition = this.nodes.handle.offsetLeft;
            } else if (rightHandlerInMaxRightPosition) {
                var leftHandlerChangeStep = Math.min(this.sizes.width - this.sizes.handleWidth, sizeChangeStep);
                newWidth = this.sizes.handleWidth + leftHandlerChangeStep;
                newLeftHandlerPosition = Math.max(0, this.nodes.handle.offsetLeft - leftHandlerChangeStep);
            } else {
                newWidth = this.sizes.handleWidth + sizeChangeStep;
                newLeftHandlerPosition = Math.max(0, this.nodes.handle.offsetLeft - (sizeChangeStep / 2));
            }
            this.nodes.handle.style.left = newLeftHandlerPosition + 'px';
            this.nodes.handle.style.width = newWidth + 'px';
        };

        InteractionSlider.prototype._calculateHandlerSizePositionOnMouseWheelUp = function (sizeChangeStep) {
            if (this.sizes.handleWidth - sizeChangeStep > this.sizes.handleMinWidth) {
                this.nodes.handle.style.left = (this.nodes.handle.offsetLeft + (sizeChangeStep / 2)) + 'px';
                this.nodes.handle.style.width = (this.sizes.handleWidth - sizeChangeStep) + 'px';
            }
        };

        InteractionSlider.prototype._onMouseUp = function (evt) {
            evt.stopImmediatePropagation();
            window.removeEventListener('mousemove', this.fRefs.mousemove);
            window.removeEventListener('mouseup', this.fRefs.mouseup);
            window.removeEventListener('dragstart', this.fRefs.dragstart);
            this._updateUI();
            this._fireSelectEvent();
        };

        InteractionSlider.prototype._onDragStart = function (evt) {
            evt.preventDefault();
        };

        InteractionSlider.prototype._fireSelectEvent = function () {
            var oldStartInterval = this.selectedInterval.start;
            var oldEndInterval = this.selectedInterval.end;
            this._calculateStartEndPeriod();

            if (oldStartInterval === this.selectedInterval.start && oldEndInterval == this.selectedInterval.end) {
                return;
            }

            jQuery("#interactionSlider").trigger("InteractionSliderChange", [ this.selectedInterval.start, this.selectedInterval.end ]);
        };

        InteractionSlider.prototype._calculateStartEndPeriod = function () {
            var sliderWidth = this.nodes.slider.offsetWidth;
            var leftHandlerPosition = this.nodes.leftResizeHandle.getBoundingClientRect().left -
                this.nodes.slider.getBoundingClientRect().left - this.HANDLE_BORDER_SIZE;
            var rightHandlerPosition = this.nodes.rightResizeHandle.getBoundingClientRect().left -
                this.nodes.slider.getBoundingClientRect().left + this.HANDLE_BORDER_SIZE + this.HANDLES_WIDTH;
            var leftHandlerPositionPercent = leftHandlerPosition / sliderWidth;
            var rightHandlerPositionPercent = rightHandlerPosition / sliderWidth;
            var leftHandlerPositionPercentRounded = Math.round(leftHandlerPositionPercent * 100) / 100;
            var rightHandlerPositionPercentRounded = Math.round(rightHandlerPositionPercent * 100) / 100;
            this.selectedInterval.start = leftHandlerPositionPercentRounded;
            this.selectedInterval.end = rightHandlerPositionPercentRounded;
        };

        InteractionSlider.prototype._calculateStartEndPeriod = function () {
            var sliderWidth = this.nodes.slider.offsetWidth;
            var leftHandlerPosition = this.nodes.leftResizeHandle.getBoundingClientRect().left -
                this.nodes.slider.getBoundingClientRect().left - this.HANDLE_BORDER_SIZE;
            var rightHandlerPosition = this.nodes.rightResizeHandle.getBoundingClientRect().left -
                this.nodes.slider.getBoundingClientRect().left + this.HANDLE_BORDER_SIZE + this.HANDLES_WIDTH;
            var leftHandlerPositionPercent = leftHandlerPosition / sliderWidth;
            var rightHandlerPositionPercent = rightHandlerPosition / sliderWidth;
            this.selectedInterval.start = leftHandlerPositionPercent;
            this.selectedInterval.end = rightHandlerPositionPercent;
        };

        return InteractionSlider;
    });