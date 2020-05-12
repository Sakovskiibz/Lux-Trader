
let project_folder = require('path').basename(__dirname + '_project');
let source_folder = '#source';

let fs = require('fs')

let path = {
	build: {
		html: project_folder + '/',
		css: project_folder + '/css/',
		js: project_folder + '/js/',
		img: project_folder + '/img/',
		fonts: project_folder + '/fonts/',
	},

	source: {
		html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
		css: source_folder + '/scss/main.scss',
		js: source_folder + '/js/scripts.js',
		img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
		fonts: source_folder + '/fonts/*.ttf',
	},

	ready_files: {
		min_css: source_folder + '/scss/*.min.css',
		min_js: source_folder + '/js/*.min.js',
	},

	watch: {
		html: source_folder + '/**/*.html',
		css: source_folder + '/scss/**/*.scss',
		js: source_folder + '/js/**/*.js',
		img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
	},

	clean: './' + project_folder + '/'
}

let { src, dest } = require('gulp'),
	gulp = require('gulp'),
	browser_sync = require('browser-sync').create(),
	files_include = require('gulp-file-include'),
	del = require('del'),
	scss_include = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	css_min = require('gulp-clean-css'),
	files_rename = require('gulp-rename'),
	js_min = require('gulp-uglify-es').default,
	img_min = require('gulp-imagemin'),
	webp = require('gulp-webp'),
	webp_html = require('gulp-webp-html'),
	webp_css = require('gulp-webpcss'),
	ttf2woff = require('gulp-ttf2woff'),
	ttf2woff2 = require('gulp-ttf2woff2'),
	otf2ttf = require('gulp-fonter');
//svg_sprite = require('gulp-svg-sprite');

function browserSync(params) {
	browser_sync.init({
		server: {
			baseDir: './' + project_folder + '/'
		},
		port: 3000,
		notify: false
	})
}

function html() {
	return src(path.source.html)
		.pipe(files_include())
		.pipe(webp_html())
		.pipe(dest(path.build.html))
		.pipe(browser_sync.stream())
}

function css() {
	return src(path.source.css)

		.pipe(scss_include({
			outputStyle: 'expanded'
		}))

		.pipe(group_media())

		.pipe(autoprefixer({
			cascade: true,
			overrideBrowserslist: ['last 5 versions']
		}))

		.pipe(webp_css({
			webpClass: '.webp',
			noWebpClass: '.no-webp'
		}))

		// .pipe(dest(path.build.css))
		// .pipe(css_min())

		// .pipe(files_rename({
		// 	extname: '.min.css'
		// }))

		.pipe(dest(path.build.css))
		.pipe(browser_sync.stream())
}

function js() {
	return src(path.source.js)
		.pipe(files_include())
		.pipe(dest(path.build.js))
		.pipe(js_min())

		.pipe(files_rename({
			extname: '.min.js'
		}))

		.pipe(dest(path.build.js))
		.pipe(browser_sync.stream())
}

function images() {
	return src(path.source.img)

		.pipe(webp({
			quality: 75
		}))

		.pipe(dest(path.build.img))
		.pipe(src(path.source.img))

		.pipe(img_min({
			progressive: true,
			svgoPlugins: [{ removeViewbox: false }],
			interlaced: true,
			optimizationLevel: 3
		}))

		.pipe(dest(path.build.img))
		.pipe(browser_sync.stream())
}

function readyCssCopy() {
	return src(path.ready_files.min_css)
		.pipe(dest(path.build.css))
		.pipe(browser_sync.stream())
}

function readyJsCopy() {
	return src(path.ready_files.min_js)
		.pipe(dest(path.build.js))
		.pipe(browser_sync.stream())
}

function fonts() {
	src(path.source.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts));
	return src(path.source.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts));
}

function fontsConn(params) {
	let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function cb() {

}

function watchFiles(params) {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], images);
}

function cleaning(params) {
	return del(path.clean)
}

gulp.task('otf2ttf', function () {
	return src([source_folder + '/fonts/*.otf'])
		.pipe(otf2ttf({
			formats: ['ttf']
		}))
		.pipe(dest(source_folder + '/fonts/'));
})

let building_project = gulp.series(cleaning, gulp.parallel(images, js, css, html, fonts, readyCssCopy, readyJsCopy), fontsConn);
let watch = gulp.parallel(building_project, watchFiles, browserSync);

exports.fontsConn = fontsConn;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.building_project = building_project;
exports.watch = watch;
exports.default = watch;