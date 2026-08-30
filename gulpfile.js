const { src, dest, parallel, watch } = require('gulp'),
  { rollup }      = require('rollup'),
  { babel }       = require('@rollup/plugin-babel'),
  sass            = require('gulp-sass')(require('sass')),
  autoprefixer    = require('gulp-autoprefixer'),
  uglify          = require('gulp-uglify-es').default,
  connect         = require('gulp-connect'),
  rootImport      = require('rollup-plugin-root-import'),
  { nodeResolve } = require('@rollup/plugin-node-resolve'),
  commonjs        = require('@rollup/plugin-commonjs');

const sassOptions = {
  loadPaths: [
    'node_modules',
    require('path').resolve(__dirname, 'node_modules')
  ]
};

const rollupOptions = {
  input: 'src/javascripts/index.js',
  plugins: [
    nodeResolve({
      mainFields: ['module', 'main', 'browser']
    }),
    commonjs({
      include: [/node_modules/]
    }),
    rootImport({
      root: `src/javascripts`,
      extensions: '.js'
    }),
    babel({
      babelHelpers: 'bundled'
    })
  ]
};

const rollupOutputOptions = {
  file: 'dist/js/index.js',
  format: 'umd',
  name: 'Shadowlord'
};

const streamToPromise = (stream) => new Promise((resolve, reject) => {
  stream.on('end', resolve);
  stream.on('finish', resolve);
  stream.on('error', reject);
});

const bundleScripts = async () => {
  const bundle = await rollup(rollupOptions);
  await bundle.write(rollupOutputOptions);
  await bundle.close();
};

const serverTask = (done) => {
  connect.server({
    root: '',
    host: '0.0.0.0',
    livereload: true
  });
  done();
};

const stylesTask = () => src('src/sass/app.scss')
  .pipe(sass.sync(sassOptions))
  .pipe(autoprefixer('last 2 version'))
  .pipe(dest('dist/css'))
  .pipe(connect.reload());

const scriptsTask = () => bundleScripts()
  .then(() => streamToPromise(src('dist/js/index.js').pipe(connect.reload())));

const htmlTask = () => src('*.html').pipe(connect.reload());

const watchTask = (done) => {
  watch('*.html', htmlTask);
  watch('src/javascripts/**', scriptsTask);
  watch('src/sass/**', stylesTask);
  done();
};

const stylesDist = () => src('src/sass/app.scss')
  .pipe(sass.sync({
    ...sassOptions,
    outputStyle: 'compressed'
  }))
  .pipe(dest('dist/css'));

const scriptsDist = () => bundleScripts()
  .then(() => streamToPromise(src('dist/js/index.js')
  .pipe(uglify())
  .pipe(dest('dist/js/'))));

exports.default = parallel(watchTask, serverTask);
exports.build = parallel(stylesDist, scriptsDist);
