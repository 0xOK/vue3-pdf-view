
import { h } from 'vue'
import EventBus from './bus'

export default function (pdfjsWrapper) {

  var createLoadingTask = pdfjsWrapper.createLoadingTask
  var PDFJSWrapper = pdfjsWrapper.PDFJSWrapper

  return {
    createLoadingTask: createLoadingTask,
    render: function () {
      return h('span', {
        style: {
          position: 'relative',
          display: 'block'
        }
      }, [
        h('canvas', {
          style: {
            display: 'inline-block',
            width: '100%',
            height: '100%',
            verticalAlign: 'top'
          },
          ref: 'canvas'
        }),
        h('span', {
          style: {
            display: 'inline-block',
            height: '100%',
            width: '100%'
          },
          class: 'annotationLayer',
          ref: 'annotationLayer'
        })
      ])
    },
    props: {
      src: {
        type: [String, Object, Uint8Array],
        default: '',
      },
      page: {
        type: Number,
        default: 1,
      },
      rotate: {
        type: Number,
      },
    },
    watch: {
      src: function () {

        this.pdf.loadDocument(this.src)
      },
      page: function () {

        this.pdf.loadPage(this.page, this.rotate)
      },
      rotate: function () {
        this.pdf.renderPage(this.rotate)
      },
    },
    methods: {
      resize: function (size) {

        // check if the element is attached to the dom tree || resizeSensor being destroyed
        if (this.$el.parentNode === null || (size.width === 0 && size.height === 0))
          return

        // on IE10- canvas height must be set
        this.$refs.canvas.style.height = this.$refs.canvas.offsetWidth * (this.$refs.canvas.height / this.$refs.canvas.width) + 'px'
        // update the page when the resolution is too poor
        var resolutionScale = this.pdf.getResolutionScale()

        if (resolutionScale < 0.85 || resolutionScale > 1.15)
          this.pdf.renderPage(this.rotate)

        // this.$refs.annotationLayer.style.transform = 'scale('+resolutionScale+')';
      },
      print: function (dpi, pageList) {

        this.pdf.printPage(dpi, pageList)
      }
    },

    // doc: mounted hook is not called during server-side rendering.
    mounted: function () {
      const vue3Bus = new EventBus()
      if (!this.vue3Bus) {
        this.vue3Bus = vue3Bus
      }
      const that = this
      const myEmit = (name, ...args) => {
        this.$emit(name, ...args)
        this.vue3Bus.$emit(name, ...args)
      }
      this.pdf = new PDFJSWrapper(this.$refs.canvas, this.$refs.annotationLayer, myEmit);


      this.vue3Bus.$on('loaded', function () {
        that.pdf.loadPage(that.page, that.rotate)
      })
      this.vue3Bus.$on('page-size', function (width, height) {
        that.$refs.canvas.style.height = that.$refs.canvas.offsetWidth * (height / width) + 'px'
      })
      this.pdf.loadDocument(this.src)


    },

    // doc: destroyed hook is not called during server-side rendering.
    destroyed: function () {

      this.pdf.destroy()
    }
  }

}