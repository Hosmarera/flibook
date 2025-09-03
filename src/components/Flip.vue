<script>
let easeIn, easeInOut, easeOut;

import Matrix from './matrix';

import spinner from './spinner.svg';

easeIn = function (x) {
    return Math.pow(x, 2);
};

easeOut = function (x) {
    return 1 - easeIn(1 - x);
};

easeInOut = function (x) {
    if (x < 0.5) {
        return easeIn(x * 2) / 2;
    } else {
        return 0.5 + easeOut((x - 0.5) * 2) / 2;
    }
};

export default {
    props: {
        pages: {
            type: Array,
            required: true
        },
        pagesHiRes: {
            type: Array,
            default: function () {
                return [];
            }
        },
        flipDuration: {
            type: Number,
            default: 1000
        },
        zoomDuration: {
            type: Number,
            default: 500
        },
        zooms: {
            type: Array,
            default: function () {
                return [1, 2, 4];
            }
        },
        perspective: {
            type: Number,
            default: 2400
        },
        nPolygons: {
            type: Number,
            default: 10
        },
        ambient: {
            type: Number,
            default: 0.4
        },
        gloss: {
            type: Number,
            default: 0.6
        },
        swipeMin: {
            type: Number,
            default: 3
        },
        singlePage: {
            type: Boolean,
            default: false
        },
        forwardDirection: {
            validator: function (val) {
                return val === 'right' || val === 'left';
            },
            default: 'right'
        },
        centering: {
            type: Boolean,
            default: true
        },
        startPage: {
            type: Number,
            default: null
        },
        loadingImage: {
            type: String,
            default: spinner
        },
        clickToZoom: {
            type: Boolean,
            default: true
        },
        dragToFlip: {
            type: Boolean,
            default: true
        },
        wheel: {
            type: String,
            default: 'scroll'
        }
    },
    data: function () {
        return {
            viewWidth: 0,
            viewHeight: 0,
            imageWidth: null,
            imageHeight: null,
            displayedPages: 1,
            nImageLoad: 0,
            nImageLoadTrigger: 0,
            imageLoadCallback: null,
            currentPage: 0,
            firstPage: 0,
            secondPage: 1,
            zoomIndex: 0,
            zoom: 1,
            zooming: false,
            touchStartX: null,
            touchStartY: null,
            maxMove: 0,
            activeCursor: null,
            hasTouchEvents: false,
            hasPointerEvents: false,
            minX: 2e308,
            maxX: -2e308,
            preloadedImages: {},
            flip: {
                progress: 0,
                direction: null,
                frontImage: null,
                backImage: null,
                auto: false,
                opacity: 1
            },
            currentCenterOffset: null,
            animatingCenter: false,
            startScrollLeft: 0,
            startScrollTop: 0,
            scrollLeft: 0,
            scrollTop: 0,
            loadedImages: {}
        };
    },
    computed: {
        IE: function () {
            return typeof navigator !== 'undefined' && /Trident/.test(navigator.userAgent);
        },
        canFlipLeft: function () {
            if (this.forwardDirection === 'left') {
                return this.canGoForward;
            } else {
                return this.canGoBack;
            }
        },
        canFlipRight: function () {
            if (this.forwardDirection === 'right') {
                return this.canGoForward;
            } else {
                return this.canGoBack;
            }
        },
        canZoomIn: function () {
            return !this.zooming && this.zoomIndex < this.zooms_.length - 1;
        },
        canZoomOut: function () {
            return !this.zooming && this.zoomIndex > 0;
        },
        numPages: function () {
            if (this.pages[0] === null) {
                return this.pages.length - 1;
            } else {
                return this.pages.length;
            }
        },
        page: function () {
            if (this.pages[0] !== null) {
                return this.currentPage + 1;
            } else {
                return Math.max(1, this.currentPage);
            }
        },
        zooms_: function () {
            return this.zooms || [1];
        },
        canGoForward: function () {
            return !this.flip.direction && this.currentPage < this.pages.length - this.displayedPages;
        },
        canGoBack: function () {
            return !this.flip.direction && this.currentPage >= this.displayedPages && !(this.displayedPages === 1 && !this.pageUrl(this.firstPage - 1));
        },
        leftPage: function () {
            if (this.forwardDirection === 'right' || this.displayedPages === 1) {
                return this.firstPage;
            } else {
                return this.secondPage;
            }
        },
        rightPage: function () {
            if (this.forwardDirection === 'left') {
                return this.firstPage;
            } else {
                return this.secondPage;
            }
        },
        showLeftPage: function () {
            return this.pageUrl(this.leftPage);
        },
        showRightPage: function () {
            return this.pageUrl(this.rightPage) && this.displayedPages === 2;
        },
        cursor: function () {
            if (this.activeCursor) {
                return this.activeCursor;
            } else if (this.IE) {
                return 'auto';
            } else if (this.clickToZoom && this.canZoomIn) {
                return 'zoom-in';
            } else if (this.clickToZoom && this.canZoomOut) {
                return 'zoom-out';
            } else if (this.dragToFlip) {
                return 'grab';
            } else {
                return 'auto';
            }
        },
        pageScale: function () {
            var scale, vw, xScale, yScale;
            vw = this.viewWidth / this.displayedPages;
            xScale = vw / this.imageWidth;
            yScale = this.viewHeight / this.imageHeight;
            scale = xScale < yScale ? xScale : yScale;
            if (scale < 1) {
                return scale;
            } else {
                return 1;
            }
        },
        pageWidth: function () {
            return Math.round(this.imageWidth * this.pageScale);
        },
        pageHeight: function () {
            return Math.round(this.imageHeight * this.pageScale);
        },
        xMargin: function () {
            return (this.viewWidth - this.pageWidth * this.displayedPages) / 2;
        },
        yMargin: function () {
            return (this.viewHeight - this.pageHeight) / 2;
        },
        polygonWidth: function () {
            var w;
            w = this.pageWidth / this.nPolygons;
            w = Math.ceil(w + 1 / this.zoom);
            return w + 'px';
        },
        polygonHeight: function () {
            return this.pageHeight + 'px';
        },
        polygonBgSize: function () {
            return `${this.pageWidth}px ${this.pageHeight}px`;
        },
        polygonArray: function () {
            return this.makePolygonArray('front').concat(this.makePolygonArray('back'));
        },
        boundingLeft: function () {
            var x;
            if (this.displayedPages === 1) {
                return this.xMargin;
            } else {
                x = this.pageUrl(this.leftPage) ? this.xMargin : this.viewWidth / 2;
                if (x < this.minX) {
                    return x;
                } else {
                    return this.minX;
                }
            }
        },
        boundingRight: function () {
            var x;
            if (this.displayedPages === 1) {
                return this.viewWidth - this.xMargin;
            } else {
                x = this.pageUrl(this.rightPage) ? this.viewWidth - this.xMargin : this.viewWidth / 2;
                if (x > this.maxX) {
                    return x;
                } else {
                    return this.maxX;
                }
            }
        },
        centerOffset: function () {
            var retval;
            retval = this.centering ? Math.round(this.viewWidth / 2 - (this.boundingLeft + this.boundingRight) / 2) : 0;
            if (this.currentCenterOffset === null && this.imageWidth !== null) {
                this.currentCenterOffset = retval;
            }
            return retval;
        },
        centerOffsetSmoothed: function () {
            return Math.round(this.currentCenterOffset);
        },
        dragToScroll: function () {
            return !this.hasTouchEvents;
        },
        scrollLeftMin: function () {
            var w;
            w = (this.boundingRight - this.boundingLeft) * this.zoom;
            if (w < this.viewWidth) {
                return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom - (this.viewWidth - w) / 2;
            } else {
                return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom;
            }
        },
        scrollLeftMax: function () {
            var w;
            w = (this.boundingRight - this.boundingLeft) * this.zoom;
            if (w < this.viewWidth) {
                return (this.boundingLeft + this.centerOffsetSmoothed) * this.zoom - (this.viewWidth - w) / 2;
            } else {
                return (this.boundingRight + this.centerOffsetSmoothed) * this.zoom - this.viewWidth;
            }
        },
        scrollTopMin: function () {
            var h;
            h = this.pageHeight * this.zoom;
            if (h < this.viewHeight) {
                return this.yMargin * this.zoom - (this.viewHeight - h) / 2;
            } else {
                return this.yMargin * this.zoom;
            }
        },
        scrollTopMax: function () {
            var h;
            h = this.pageHeight * this.zoom;
            if (h < this.viewHeight) {
                return this.yMargin * this.zoom - (this.viewHeight - h) / 2;
            } else {
                return (this.yMargin + this.pageHeight) * this.zoom - this.viewHeight;
            }
        },
        scrollLeftLimited: function () {
            return Math.min(this.scrollLeftMax, Math.max(this.scrollLeftMin, this.scrollLeft));
        },
        scrollTopLimited: function () {
            return Math.min(this.scrollTopMax, Math.max(this.scrollTopMin, this.scrollTop));
        }
    },
    mounted: function () {
        window.addEventListener('resize', this.onResize, {
            passive: true
        });
        this.onResize();
        this.zoom = this.zooms_[0];
        return this.goToPage(this.startPage);
    },
    beforeDestroy: function () {
        return window.removeEventListener('resize', this.onResize, {
            passive: true
        });
    },
    methods: {
        onResize: function () {
            var viewport;
            viewport = this.$refs.viewport;
            if (!viewport) {
                return;
            }
            this.viewWidth = viewport.clientWidth;
            this.viewHeight = viewport.clientHeight;
            this.displayedPages = this.viewWidth > this.viewHeight && !this.singlePage ? 2 : 1;
            if (this.displayedPages === 2) {
                this.currentPage &= ~1;
            }
            this.fixFirstPage();
            this.minX = 2e308;
            return this.maxX = -2e308;
        },
        fixFirstPage: function () {
            if (this.displayedPages === 1 && this.currentPage === 0 && this.pages.length && !this.pageUrl(0)) {
                return this.currentPage++;
            }
        },
        pageUrl: function (page, hiRes = false) {
            var url;
            if (hiRes && this.zoom > 1 && !this.zooming) {
                url = this.pagesHiRes[page];
                if (url) {
                    return url;
                }
            }
            return this.pages[page] || null;
        },
        pageUrlLoading: function (page, hiRes = false) {
            var url;
            url = this.pageUrl(page, hiRes);
            if (hiRes && this.zoom > 1 && !this.zooming) {
                // High-res image doesn't use 'loading'
                return url;
            }
            return url && this.loadImage(url);
        },
        flipLeft: function () {
            if (!this.canFlipLeft) {
                return;
            }
            return this.flipStart('left', true);
        },
        flipRight: function () {
            if (!this.canFlipRight) {
                return;
            }
            return this.flipStart('right', true);
        },
        makePolygonArray: function (face) {
            var bgPos, dRadian, dRotate, direction, i, image, j, lighting, m, originRight, pageMatrix, pageRotation, pageX, polygonWidth, progress, rad, radian, radius, ref, results, rotate, theta, x, x0, x1, z;
            if (!this.flip.direction) {
                return [];
            }
            progress = this.flip.progress;
            direction = this.flip.direction;
            if (this.displayedPages === 1 && direction !== this.forwardDirection) {
                progress = 1 - progress;
                direction = this.forwardDirection;
            }
            this.flip.opacity = this.displayedPages === 1 && progress > .7 ? 1 - (progress - .7) / .3 : 1;
            image = face === 'front' ? this.flip.frontImage : this.flip.backImage;
            polygonWidth = this.pageWidth / this.nPolygons;
            pageX = this.xMargin;
            originRight = false;
            if (this.displayedPages === 1) {
                if (this.forwardDirection === 'right') {
                    if (face === 'back') {
                        originRight = true;
                        pageX = this.xMargin - this.pageWidth;
                    }
                } else {
                    if (direction === 'left') {
                        if (face === 'back') {
                            pageX = this.pageWidth - this.xMargin;
                        } else {
                            originRight = true;
                        }
                    } else {
                        if (face === 'front') {
                            pageX = this.pageWidth - this.xMargin;
                        } else {
                            originRight = true;
                        }
                    }
                }
            } else {
                if (direction === 'left') {
                    if (face === 'back') {
                        pageX = this.viewWidth / 2;
                    } else {
                        originRight = true;
                    }
                } else {
                    if (face === 'front') {
                        pageX = this.viewWidth / 2;
                    } else {
                        originRight = true;
                    }
                }
            }
            pageMatrix = new Matrix();
            pageMatrix.translate(this.viewWidth / 2);
            pageMatrix.perspective(this.perspective);
            pageMatrix.translate(-this.viewWidth / 2);
            pageMatrix.translate(pageX, this.yMargin);
            pageRotation = 0;
            if (progress > 0.5) {
                pageRotation = -(progress - 0.5) * 2 * 180;
            }
            if (direction === 'left') {
                pageRotation = -pageRotation;
            }
            if (face === 'back') {
                pageRotation += 180;
            }
            if (pageRotation) {
                if (originRight) {
                    pageMatrix.translate(this.pageWidth);
                }
                pageMatrix.rotateY(pageRotation);
                if (originRight) {
                    pageMatrix.translate(-this.pageWidth);
                }
            }
            if (progress < 0.5) {
                theta = progress * 2 * Math.PI;
            } else {
                theta = (1 - (progress - 0.5) * 2) * Math.PI;
            }
            if (theta === 0) {
                theta = 1e-9;
            }
            radius = this.pageWidth / theta;
            radian = 0;
            dRadian = theta / this.nPolygons;
            rotate = dRadian / 2 / Math.PI * 180;
            dRotate = dRadian / Math.PI * 180;
            if (originRight) {
                rotate = -theta / Math.PI * 180 + dRotate / 2;
            }
            if (face === 'back') {
                rotate = -rotate;
                dRotate = -dRotate;
            }
            this.minX = 2e308;
            this.maxX = -2e308;
            results = [];
            for (i = j = 0, ref = this.nPolygons; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
                bgPos = `${i / (this.nPolygons - 1) * 100}% 0px`;
                m = pageMatrix.clone();
                rad = originRight ? theta - radian : radian;
                x = Math.sin(rad) * radius;
                if (originRight) {
                    x = this.pageWidth - x;
                }
                z = (1 - Math.cos(rad)) * radius;
                if (face === 'back') {
                    z = -z;
                }
                m.translate3d(x, 0, z);
                m.rotateY(-rotate);
                x0 = m.transformX(0);
                x1 = m.transformX(polygonWidth);
                this.maxX = Math.max(Math.max(x0, x1), this.maxX);
                this.minX = Math.min(Math.min(x0, x1), this.minX);
                lighting = this.computeLighting(pageRotation - rotate, dRotate);
                radian += dRadian;
                rotate += dRotate;
                results.push([face + i, image, lighting, bgPos, m.toString(), Math.abs(Math.round(z))]);
            }
            return results;
        },
        computeLighting: function (rot, dRotate) {
            var DEG, POW, blackness, diffuse, gradients, lightingPoints, specular;
            gradients = [];
            lightingPoints = [-0.5, -0.25, 0, 0.25, 0.5];
            if (this.ambient < 1) {
                blackness = 1 - this.ambient;
                diffuse = lightingPoints.map((d) => {
                    return (1 - Math.cos((rot - dRotate * d) / 180 * Math.PI)) * blackness;
                });
                gradients.push(`linear-gradient(to right,
  rgba(0, 0, 0, ${diffuse[0]}),
  rgba(0, 0, 0, ${diffuse[1]}) 25%,
  rgba(0, 0, 0, ${diffuse[2]}) 50%,
  rgba(0, 0, 0, ${diffuse[3]}) 75%,
  rgba(0, 0, 0, ${diffuse[4]}))`);
            }
            if (this.gloss > 0 && !this.IE) {
                DEG = 30;
                POW = 200;
                specular = lightingPoints.map((d) => {
                    return Math.max(Math.cos((rot + DEG - dRotate * d) / 180 * Math.PI) ** POW, Math.cos((rot - DEG - dRotate * d) / 180 * Math.PI) ** POW);
                });
                gradients.push(`linear-gradient(to right,
  rgba(255, 255, 255, ${specular[0] * this.gloss}),
  rgba(255, 255, 255, ${specular[1] * this.gloss}) 25%,
  rgba(255, 255, 255, ${specular[2] * this.gloss}) 50%,
  rgba(255, 255, 255, ${specular[3] * this.gloss}) 75%,
  rgba(255, 255, 255, ${specular[4] * this.gloss}))`);
            }
            return gradients.join(',');
        },
        flipStart: function (direction, auto) {
            if (direction !== this.forwardDirection) {
                if (this.displayedPages === 1) {
                    this.flip.frontImage = this.pageUrl(this.currentPage - 1);
                    this.flip.backImage = null;
                } else {
                    this.flip.frontImage = this.pageUrl(this.firstPage);
                    this.flip.backImage = this.pageUrl(this.currentPage - this.displayedPages + 1);
                }
            } else {
                if (this.displayedPages === 1) {
                    this.flip.frontImage = this.pageUrl(this.currentPage);
                    this.flip.backImage = null;
                } else {
                    this.flip.frontImage = this.pageUrl(this.secondPage);
                    this.flip.backImage = this.pageUrl(this.currentPage + this.displayedPages);
                }
            }
            this.flip.direction = direction;
            this.flip.progress = 0;
            return requestAnimationFrame(() => {
                return requestAnimationFrame(() => {
                    if (this.flip.direction !== this.forwardDirection) {
                        if (this.displayedPages === 2) {
                            this.firstPage = this.currentPage - this.displayedPages;
                        }
                    } else {
                        if (this.displayedPages === 1) {
                            this.firstPage = this.currentPage + this.displayedPages;
                        } else {
                            this.secondPage = this.currentPage + 1 + this.displayedPages;
                        }
                    }
                    if (auto) {
                        return this.flipAuto(true);
                    }
                });
            });
        },
        flipAuto: function (ease) {
            var animate, duration, startRatio, t0;
            t0 = Date.now();
            duration = this.flipDuration * (1 - this.flip.progress);
            startRatio = this.flip.progress;
            this.flip.auto = true;
            this.$emit(`flip-${this.flip.direction}-start`, this.page);
            animate = () => {
                return requestAnimationFrame(() => {
                    var ratio, t;
                    t = Date.now() - t0;
                    ratio = startRatio + t / duration;
                    if (ratio > 1) {
                        ratio = 1;
                    }
                    this.flip.progress = ease ? easeInOut(ratio) : ratio;
                    if (ratio < 1) {
                        return animate();
                    } else {
                        if (this.flip.direction !== this.forwardDirection) {
                            this.currentPage -= this.displayedPages;
                        } else {
                            this.currentPage += this.displayedPages;
                        }
                        this.$emit(`flip-${this.flip.direction}-end`, this.page);
                        if (this.displayedPages === 1 && this.flip.direction === this.forwardDirection) {
                            this.flip.direction = null;
                        } else {
                            this.onImageLoad(1, () => {
                                return this.flip.direction = null;
                            });
                        }
                        return this.flip.auto = false;
                    }
                });
            };
            return animate();
        },
        flipRevert: function () {
            var animate, duration, startRatio, t0;
            t0 = Date.now();
            duration = this.flipDuration * this.flip.progress;
            startRatio = this.flip.progress;
            this.flip.auto = true;
            animate = () => {
                return requestAnimationFrame(() => {
                    var ratio, t;
                    t = Date.now() - t0;
                    ratio = startRatio - startRatio * t / duration;
                    if (ratio < 0) {
                        ratio = 0;
                    }
                    this.flip.progress = ratio;
                    if (ratio > 0) {
                        return animate();
                    } else {
                        this.firstPage = this.currentPage;
                        this.secondPage = this.currentPage + 1;
                        if (this.displayedPages === 1 && this.flip.direction !== this.forwardDirection) {
                            this.flip.direction = null;
                        } else {
                            this.onImageLoad(1, () => {
                                return this.flip.direction = null;
                            });
                        }
                        return this.flip.auto = false;
                    }
                });
            };
            return animate();
        },
        onImageLoad: function (trigger, cb) {
            this.nImageLoad = 0;
            this.nImageLoadTrigger = trigger;
            return this.imageLoadCallback = cb;
        },
        didLoadImage: function (ev) {
            if (this.imageWidth === null) {
                this.imageWidth = (ev.target || ev.path[0]).naturalWidth;
                this.imageHeight = (ev.target || ev.path[0]).naturalHeight;
                this.preloadImages();
            }
            if (!this.imageLoadCallback) {
                return;
            }
            if (++this.nImageLoad >= this.nImageLoadTrigger) {
                this.imageLoadCallback();
                return this.imageLoadCallback = null;
            }
        },
        zoomIn: function (zoomAt = null) {
            if (!this.canZoomIn) {
                return;
            }
            this.zoomIndex += 1;
            return this.zoomTo(this.zooms_[this.zoomIndex], zoomAt);
        },
        zoomOut: function (zoomAt = null) {
            if (!this.canZoomOut) {
                return;
            }
            this.zoomIndex -= 1;
            return this.zoomTo(this.zooms_[this.zoomIndex], zoomAt);
        },
        zoomTo: function (zoom, zoomAt = null) {
            var animate, containerFixedX, containerFixedY, end, endX, endY, fixedX, fixedY, rect, start, startX, startY, t0, viewport;
            viewport = this.$refs.viewport;
            if (zoomAt) {
                rect = viewport.getBoundingClientRect();
                fixedX = zoomAt.pageX - rect.left;
                fixedY = zoomAt.pageY - rect.top;
            } else {
                fixedX = viewport.clientWidth / 2;
                fixedY = viewport.clientHeight / 2;
            }
            start = this.zoom;
            end = zoom;
            startX = viewport.scrollLeft;
            startY = viewport.scrollTop;
            containerFixedX = fixedX + startX;
            containerFixedY = fixedY + startY;
            endX = containerFixedX / start * end - fixedX;
            endY = containerFixedY / start * end - fixedY;
            t0 = Date.now();
            this.zooming = true;
            this.$emit('zoom-start', zoom);
            animate = () => {
                return requestAnimationFrame(() => {
                    var ratio, t;
                    t = Date.now() - t0;
                    ratio = t / this.zoomDuration;
                    if (ratio > 1 || this.IE) {
                        ratio = 1;
                    }
                    ratio = easeInOut(ratio);
                    this.zoom = start + (end - start) * ratio;
                    this.scrollLeft = startX + (endX - startX) * ratio;
                    this.scrollTop = startY + (endY - startY) * ratio;
                    if (t < this.zoomDuration) {
                        return animate();
                    } else {
                        this.$emit('zoom-end', zoom);
                        this.zooming = false;
                        this.zoom = zoom;
                        this.scrollLeft = endX;
                        return this.scrollTop = endY;
                    }
                });
            };
            animate();
            if (end > 1) {
                return this.preloadImages(true);
            }
        },
        zoomAt: function (zoomAt) {
            this.zoomIndex = (this.zoomIndex + 1) % this.zooms_.length;
            return this.zoomTo(this.zooms_[this.zoomIndex], zoomAt);
        },
        swipeStart: function (touch) {
            this.touchStartX = touch.pageX;
            this.touchStartY = touch.pageY;
            this.maxMove = 0;
            if (this.zoom <= 1) {
                if (this.dragToFlip) {
                    return this.activeCursor = 'grab';
                }
            } else {
                this.startScrollLeft = this.$refs.viewport.scrollLeft;
                this.startScrollTop = this.$refs.viewport.scrollTop;
                return this.activeCursor = 'all-scroll';
            }
        },
        swipeMove: function (touch) {
            var x, y;
            if (this.touchStartX == null) {
                return;
            }
            x = touch.pageX - this.touchStartX;
            y = touch.pageY - this.touchStartY;
            this.maxMove = Math.max(this.maxMove, Math.abs(x));
            this.maxMove = Math.max(this.maxMove, Math.abs(y));
            if (this.zoom > 1) {
                if (this.dragToScroll) {
                    this.dragScroll(x, y);
                }
                return;
            }
            if (!this.dragToFlip) {
                return;
            }
            if (Math.abs(y) > Math.abs(x)) {
                return;
            }
            this.activeCursor = 'grabbing';
            if (x > 0) {
                if (this.flip.direction === null && this.canFlipLeft && x >= this.swipeMin) {
                    this.flipStart('left', false);
                }
                if (this.flip.direction === 'left') {
                    this.flip.progress = x / this.pageWidth;
                    if (this.flip.progress > 1) {
                        this.flip.progress = 1;
                    }
                }
            } else {
                if (this.flip.direction === null && this.canFlipRight && x <= -this.swipeMin) {
                    this.flipStart('right', false);
                }
                if (this.flip.direction === 'right') {
                    this.flip.progress = -x / this.pageWidth;
                    if (this.flip.progress > 1) {
                        this.flip.progress = 1;
                    }
                }
            }
            return true;
        },
        swipeEnd: function (touch) {
            if (this.touchStartX == null) {
                return;
            }
            if (this.clickToZoom && this.maxMove < this.swipeMin) {
                this.zoomAt(touch);
            }
            if (this.flip.direction !== null && !this.flip.auto) {
                if (this.flip.progress > 1 / 4) {
                    this.flipAuto(false);
                } else {
                    this.flipRevert();
                }
            }
            this.touchStartX = null;
            return this.activeCursor = null;
        },
        onTouchStart: function (ev) {
            this.hasTouchEvents = true;
            return this.swipeStart(ev.changedTouches[0]);
        },
        onTouchMove: function (ev) {
            if (this.swipeMove(ev.changedTouches[0])) {
                if (ev.cancelable) {
                    return ev.preventDefault();
                }
            }
        },
        onTouchEnd: function (ev) {
            return this.swipeEnd(ev.changedTouches[0]);
        },
        onPointerDown: function (ev) {
            this.hasPointerEvents = true;
            if (this.hasTouchEvents) {
                return;
            }
            if (ev.which && ev.which !== 1) { // Ignore right-click
                return;
            }
            this.swipeStart(ev);
            try {
                return ev.target.setPointerCapture(ev.pointerId);
            } catch (error) {

            }
        },
        onPointerMove: function (ev) {
            if (!this.hasTouchEvents) {
                return this.swipeMove(ev);
            }
        },
        onPointerUp: function (ev) {
            if (this.hasTouchEvents) {
                return;
            }
            this.swipeEnd(ev);
            try {
                return ev.target.releasePointerCapture(ev.pointerId);
            } catch (error) {

            }
        },
        onMouseDown: function (ev) {
            if (this.hasTouchEvents || this.hasPointerEvents) {
                return;
            }
            if (ev.which && ev.which !== 1) { // Ignore right-click
                return;
            }
            return this.swipeStart(ev);
        },
        onMouseMove: function (ev) {
            if (!(this.hasTouchEvents || this.hasPointerEvents)) {
                return this.swipeMove(ev);
            }
        },
        onMouseUp: function (ev) {
            if (!(this.hasTouchEvents || this.hasPointerEvents)) {
                return this.swipeEnd(ev);
            }
        },
        dragScroll: function (x, y) {
            this.scrollLeft = this.startScrollLeft - x;
            return this.scrollTop = this.startScrollTop - y;
        },
        onWheel: function (ev) {
            if (this.wheel === 'scroll' && this.zoom > 1 && this.dragToScroll) {
                this.scrollLeft = this.$refs.viewport.scrollLeft + ev.deltaX;
                this.scrollTop = this.$refs.viewport.scrollTop + ev.deltaY;
                if (ev.cancelable) {
                    ev.preventDefault();
                }
            }
            if (this.wheel === 'zoom') {
                if (ev.deltaY >= 100) {
                    this.zoomOut(ev);
                    return ev.preventDefault();
                } else if (ev.deltaY <= -100) {
                    this.zoomIn(ev);
                    return ev.preventDefault();
                }
            }
        },
        preloadImages: function (hiRes = false) {
            var i, j, k, ref, ref1, ref2, ref3, src;
            for (i = j = ref = this.currentPage - 3, ref1 = this.currentPage + 3; (ref <= ref1 ? j <= ref1 : j >= ref1); i = ref <= ref1 ? ++j : --j) {
                this.pageUrlLoading(i); // this preloads image
            }
            if (hiRes) {
                for (i = k = ref2 = this.currentPage, ref3 = this.currentPage + this.displayedPages; (ref2 <= ref3 ? k < ref3 : k > ref3); i = ref2 <= ref3 ? ++k : --k) {
                    src = this.pagesHiRes[i];
                    if (src) {
                        (new Image()).src = src;
                    }
                }
            }
        },
        goToPage: function (p) {
            if (p === null || p === this.page) {
                return;
            }
            if (this.pages[0] === null) {
                if (this.displayedPages === 2 && p === 1) {
                    this.currentPage = 0;
                } else {
                    this.currentPage = p;
                }
            } else {
                this.currentPage = p - 1;
            }
            this.minX = 2e308;
            this.maxX = -2e308;
            return this.currentCenterOffset = this.centerOffset;
        },
        loadImage: function (url) {
            var img;
            if (this.imageWidth === null) {
                // First loaded image defines the image width and height.
                // So it must be true image, not 'loading' image.
                return url;
            } else {
                if (this.loadedImages[url]) {
                    return url;
                } else {
                    img = new Image();
                    img.onload = () => {
                        if (this.$set) {
                            return this.$set(this.loadedImages, url, true);
                        } else {
                            return this.loadedImages[url] = true;
                        }
                    };
                    img.src = url;
                    return this.loadingImage;
                }
            }
        }
    },
    watch: {
        currentPage: function () {
            this.firstPage = this.currentPage;
            this.secondPage = this.currentPage + 1;
            return this.preloadImages();
        },
        centerOffset: function () {
            var animate;
            if (this.animatingCenter) {
                return;
            }
            animate = () => {
                return requestAnimationFrame(() => {
                    var diff, rate;
                    rate = 0.1;
                    diff = this.centerOffset - this.currentCenterOffset;
                    if (Math.abs(diff) < 0.5) {
                        this.currentCenterOffset = this.centerOffset;
                        return this.animatingCenter = false;
                    } else {
                        this.currentCenterOffset += diff * rate;
                        return animate();
                    }
                });
            };
            this.animatingCenter = true;
            return animate();
        },
        scrollLeftLimited: function (val) {
            if (this.IE) {
                return requestAnimationFrame(() => {
                    return this.$refs.viewport.scrollLeft = val;
                });
            } else {
                return this.$refs.viewport.scrollLeft = val;
            }
        },
        scrollTopLimited: function (val) {
            if (this.IE) {
                return requestAnimationFrame(() => {
                    return this.$refs.viewport.scrollTop = val;
                });
            } else {
                return this.$refs.viewport.scrollTop = val;
            }
        },
        pages: function (after, before) {
            this.fixFirstPage();
            if (!(before != null ? before.length : void 0) && (after != null ? after.length : void 0)) {
                if (this.startPage > 1 && after[0] === null) {
                    return this.currentPage++;
                }
            }
        },
        startPage: function (p) {
            return this.goToPage(p);
        }
    }
};

</script>

<template>
    <div>
        <slot v-bind="{
            canFlipLeft,
            canFlipRight,
            canZoomIn,
            canZoomOut,
            page,
            numPages,
            flipLeft,
            flipRight,
            zoomIn,
            zoomOut,
        }" />
        <div class="viewport" ref="viewport" :class="{
            zoom: zooming || zoom > 1,
            'drag-to-scroll': dragToScroll,
        }" :style="{ cursor: cursor == 'grabbing' ? 'grabbing' : 'auto' }" @touchmove="onTouchMove"
            @pointermove="onPointerMove" @mousemove="onMouseMove" @touchend="onTouchEnd" @touchcancel="onTouchEnd"
            @pointerup="onPointerUp" @pointercancel="onPointerUp" @mouseup="onMouseUp" @wheel="onWheel">
            <div class="flipbook-container" :style="{ transform: `scale(${zoom})` }">
                <div class="click-to-flip left" :style="{ cursor: canFlipLeft ? 'pointer' : 'auto' }"
                    @click="flipLeft" />
                <div class="click-to-flip right" :style="{ cursor: canFlipRight ? 'pointer' : 'auto' }"
                    @click="flipRight" />
                <div :style="{ transform: `translateX(${centerOffsetSmoothed}px)` }">
                    <img class="page fixed" :style="{
                        width: pageWidth + 'px',
                        height: pageHeight + 'px',
                        left: xMargin + 'px',
                        top: yMargin + 'px',
                    }" :src="pageUrlLoading(leftPage, true)" v-if="showLeftPage" @load="didLoadImage($event)" />
                    <img class="page fixed" :style="{
                        width: pageWidth + 'px',
                        height: pageHeight + 'px',
                        left: viewWidth / 2 + 'px',
                        top: yMargin + 'px',
                    }" v-if="showRightPage" :src="pageUrlLoading(rightPage, true)" @load="didLoadImage($event)" />

                    <div :style="{ opacity: flip.opacity }">
                        <div v-for="[
                            key,
                            bgImage,
                            lighting,
                            bgPos,
                            transform,
                            z,
                        ] in polygonArray" class="polygon" :key="key" :class="{ blank: !bgImage }" :style="{
                            backgroundImage: bgImage && `url(${loadImage(bgImage)})`,
                            backgroundSize: polygonBgSize,
                            backgroundPosition: bgPos,
                            width: polygonWidth,
                            height: polygonHeight,
                            transform: transform,
                            zIndex: z,
                        }">
                            <div class="lighting" v-show="lighting.length" :style="{ backgroundImage: lighting }" />
                        </div>
                    </div>
                    <div class="bounding-box" :style="{
                        left: boundingLeft + 'px',
                        top: yMargin + 'px',
                        width: boundingRight - boundingLeft + 'px',
                        height: pageHeight + 'px',
                        cursor: cursor,
                    }" @touchstart="onTouchStart" @pointerdown="onPointerDown" @mousedown="onMouseDown" />
                </div>
            </div>
        </div>
    </div>
</template>