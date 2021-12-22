/*

Script to automate initial steps of image processing in PixInsight.

For information check the page https://ruuth.xyz/AutoIntegrateInfo.html

Script has a GUI interface where some processing options can be selected.

In the end there will be integrated light files and automatically
processed final image. Script accepts LRGB, color and narrowband files. 
It is also possible do only partial processing and continue manually.

Clicking button AutoRun on GUI all the following steps listed below are performed.

LRGB files need to have keyword FILTER that has values for Luminance, Red, Green
or Blue channels. A couple of variants are accepted like 'Red' or 'R'.
If keyword FILTER is not found images are assumed to be color images. Also
camera RAW files can be used.

Script creates an AutoIntegrate.log file where details of the processing can be checked.

NOTE! These steps may not be updated with recent changes. They do describe the basic
      processing but some details may have changed.

Manual processing
-----------------

It is possible to rerun the script by clicking button AutoContinue with following steps 
if there are manually created images:
- L_HT + RGB_HT
  LRGB image with HistogramTransformation already done, the script starts after step <lHT> and <rgbHT>.
- RGB_HT
  Color (RGB) image with HistogramTransformation already done, the script starts after step <colorHT>.
- Integration_L_BE + Integration_RGB_BE
  LRGB image background extracted, the script starts after step <lABE> and <rgbABE>.
- Integration_RGB_BE
  Color (RGB) image background extracted, the script starts with after step <colorABE>.
- Integration_L_BE + Integration_R_BE + Integration_G_BE + Integration_B_BE
  LRGB image background extracted before image integration, the script starts after step <lABE> and 
   <rgbDBE>. Automatic ABE is then skipped.
- Integration_L + Integration_R + Integration_G + Integration_B + + Integration_H + Integration_S + Integration_O
  (L)RGB or narrowband image with integrated L,R,G,B;H,S,O images the script starts with step <lII>. 

Note that it is possible to run first automatic processing and then manually enhance some 
intermediate files and autocontinue there. 
- Crop integrated images and continue automatic processing using cropped images.
- Run manual DBE.

Calibration steps
-----------------

Calibration can run two basic workflows, one with bias files and one
with flat dark files. There are some option to make small changes
on those,

1. In each file page in GUI, select light, bias, dark, flat and/or flat dark frames. 
   If only light are selected the calibration is skipped. Also bias, dark, flat or 
   flat dark files may be not selected, so any one of those can be left out. Script 
   tries to automatically detect different filters, or OSC/RAW files.
2. If bias files are present, those are integrated into master bias. Optionally a superbias
   file is created.
3. If dark files are present, those are optionally calibrated using master bias and then integrated 
   into master dark.
4. If flat dark files are present, those are integrated  into master flat dark.
5. If flat files are present, those are calibrated using master bias and master dark, or master
   flat dark, and then integrated into master flat.
6. Light files are then calibrated using master bias, master dark and master flat.

Generic steps for all files
---------------------------

1. If light files not already selects, script opens a file dialog. On that select 
   all *.fit (or other) files. LRGB, color, RAW and narrowband files can be used.
2. Optionally linear defect detection is run to find column and row defects. Defect information
   is used by the CosmeticCorrection.
3. By default run CosmeticCorrection for each file.
4. OSC/RAW files are debayered.
5. SubframeSelector is run on files to measure and generate SSWEIGHT for
   each file. Output is *_a.xisf files.
6. Files are scanned and the file with highest SSWEIGHT is selected as a
   reference.
7. StarAlign is run on all files and *_a_r.xisf files are
   generated.
8. Optionally there is LocalNormalization on all files.

Steps with LRGB files
---------------------

1. ImageIntegration is run on LRGB files. Rejection method is chosen dynamically 
   based on the number of image files, or specified by the user. <lII>
   After this step there are Integration_L, Integration_R, Integration_G and Integration_B images,
   or with narrowband Integration_H, Integration_S and Integration_O.
2. Optionally ABE in run on L image. <lABE>
3. HistogramTransform is run on L image. <lHT>
4. Stretched L image is stored as a mask unless user has a predefined mask named range_mask.
5. Noise reduction is run on L image using a mask.
6. If ABE_before_channel_combination is selected then ABE is run on each color channel (R,G,B). 
   <rgbDBE>
7. By default LinearFit is run on RGB channels using L, R, G or B as a reference
8. If Channel noise reduction is non-zero then noise reduction is done separately 
   for each R,G and B images using a mask.
9. ChannelCombination is run on Red, Green and Blue integrated images to
   create an RGB image. After that there is one L and one RGB image.
10. If color_calibration_before_ABE is selected then color calibration is run on RGB image.
    If use_background_neutralization is selected then BackgroundNeutralization is run before
    color calibration.
11. Optionally AutomaticBackgroundExtraction is run on RGB image. <rgbABE>
12. If color calibration is not yet done the color calibration is run on RGB image. Optionally
    BackgroundNeutralization is run before color calibration
13. HistogramTransform is run on RGB image. <rgbHT>
14. Optionally TGVDenoise is run to reduce color noise.
15. Optionally a slight CurvesTransformation is run on RGB image to increase saturation.
    By default saturation is increased also when the image is still in a linear
    format.
16. LRGBCombination is run to generate final LRGB image.

Steps with color files
----------------------

1. ImageIntegration is run on color *_a_r.xisf files.
   Rejection method is chosen dynamically based on the number of image files.
   After this step there is Integration_RGB image.
2. If color_calibration_before_ABE is selected then color calibration is run on RGB image.
   If use_background_neutralization is selected then BackgroundNeutralization is run before
   color calibration.
3. Optionally ABE in run on RGB image. <colorABE>
4. If color calibration is not yet done the color calibration is run on RGB image. Optionally
   BackgroundNeutralization is run before color calibration
5. HistogramTransform is run on RGB image. <colorHT>
6. A mask is created from an extracted and stretched luminance channel.
7. MultiscaleLinearTransform is run on color RGB image to reduce noise.
   Mask is used to target noise reduction more on the background.
8. Optionally a slight CurvesTransformation is run on RGB image to increase saturation.

Steps with narrowband files
---------------------------

Steps for narrowband files are a bit similar to LRGB files but without L channel.
- There is an option to choose how S, H and O files and mapped to R, G and B channels.
- Color calibration is not run on narrowband images
- Saturation default setting 1 does not increase saturation on narrowband images.
- Linear fit for can be used for R, G or B channels. In that case script runs linked STF 
  stretch. Default is to use unlinked STF stretch for narrowband files.
- PixelMath expression can chosen from a list or edited manually for custom blending.
  PixelMath expressions can also include RGB channels.

Narrowband to RGB mapping
-------------------------

A special processing is used for narrowband to (L)RGB image mapping. It is used 
to enhance (L)RGB channels with narrowband data. It cannot be used without RGB filters.
This mapping is similar to NBRGBCombination script in PixInsight or as described in 
Light Vortex Astronomy tutorial Combining LRGB with Narrowband. You can find more 
details on parameters from those sources.

Common final steps for all images
---------------------------------

1. SCNR is run on to reduce green cast.
2. MultiscaleLinearTransform is run to sharpen the image. A mask is used to target
   sharpening more on the light parts of the image.
3. Extra windows are closed or minimized.

Notes to self:
- Start mask when set will target operation on stars.
- Luminance mask when set will target operations on light parts of the image.
- Range mask from RangeSelection is opposite to luminance mask. So user must invert range_mask.


Credits and Copyright notices
-----------------------------

PixInsight scripts that come with the product were a great help.
Web site Light Vortex Astronomy (http://www.lightvortexastronomy.com/)
was a great place to find details and best practices when using PixInsight.
For calibration another useful link is a PixInsight forum post
"For beginners: Guide to PI's ImageCalibration":
https://pixinsight.com/forum/index.php?threads/for-beginners-guide-to-pis-imagecalibration.11547/

Routines ApplyAutoSTF and applySTF are from PixInsight scripts that are 
distributed with PixInsight. 

Routines for Linear Defect Detection are from PixInsight scripts 
LinearDefectDetection.js and CommonFunctions.jsh that is distributed 
with PixInsight. 

This product is based on software from the PixInsight project, developed
by Pleiades Astrophoto and its contributors (https://pixinsight.com/).

Copyright (c) 2018-2021 Jarmo Ruuth. All Rights Reserved.

Window name prefix and icon location code

      Copyright (c) 2021 rob pfile. All Rights Reserved.

The following copyright notice is for Linear Defect Detection

   Copyright (c) 2019 Vicent Peris (OAUV). All Rights Reserved.

The following copyright notice is for routines ApplyAutoSTF and applySTF:

   Copyright (c) 2003-2020 Pleiades Astrophoto S.L. All Rights Reserved.

The following condition apply for routines ApplyAutoSTF, applySTF and 
Linear Defect Detection:

   Redistribution and use in both source and binary forms, with or without
   modification, is permitted provided that the following conditions are met:
   
   1. All redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
   
   2. All redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
   
   3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
      of their contributors, may be used to endorse or promote products derived
      from this software without specific prior written permission. For written
      permission, please contact info@pixinsight.com.
  
   4. All products derived from this software, in any form whatsoever, must
      reproduce the following acknowledgment in the end-user documentation
      and/or other materials provided with the product:
  
      "This product is based on software from the PixInsight project, developed
      by Pleiades Astrophoto and its contributors (https://pixinsight.com/)."
   
      Alternatively, if that is where third-party acknowledgments normally
      appear, this acknowledgment must be reproduced in the product itself.
  
   THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
   TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
   PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
   INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
   DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   POSSIBILITY OF SUCH DAMAGE.

*/

#feature-id   Batch Processing > AutoIntegrate

#feature-info A script for running basic image processing workflow

#define SETTINGSKEY "AutoIntegrate"

#include <pjsr/ColorSpace.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/ImageOp.jsh>
#include <pjsr/DataType.jsh>

// temporary debugging
var debug = false;
var get_process_defaults = false;

var autointegrate_version = "AutoIntegrate v1.38";

var pixinsight_version_str;   // PixInsight version string, e.g. 1.8.8.10
var pixinsight_version_num;   // PixInsight version number, e.h. 1080810

// GUI variables
var infoLabel;
var windowPrefixHelpTips;     // For updating tooTip
var closeAllPrefixButton;     // For updating toolTip
var windowPrefixComboBox;     // For updating prefix name list

/*
      Parameters that can be adjusted in the GUI
      These can be saved to persistent module settings or 
      process icon and later restored.
      Note that there is another parameter set ppar which are
      saved only to persistent module settings.
      For reset, we need to keep track of GUI element where
      these values are used. Fields where values are stored
      are: .currentItem, .checked, .editText, .setValue, .value
*/
var par = {
      // Image processing parameters
      local_normalization: { val: false, def: false, name : "Local normalization", type : 'B' },
      fix_column_defects: { val: false, def: false, name : "Fix column defects", type : 'B' },
      fix_row_defects: { val: false, def: false, name : "Fix row defects", type : 'B' },
      skip_cosmeticcorrection: { val: false, def: false, name : "Cosmetic correction", type : 'B' },
      skip_subframeselector: { val: false, def: false, name : "SubframeSelector", type : 'B' },
      strict_StarAlign: { val: false, def: false, name : "Strict StarAlign", type : 'B' },
      binning: { val: 0, def: 0, name : "Binning", type : 'I' },
      ABE_before_channel_combination: { val: false, def: false, name : "ABE before channel combination", type : 'B' },
      ABE_on_lights: { val: false, def: false, name : "ABE on light images", type : 'B' },
      use_ABE_on_L_RGB: { val: false, def: false, name : "Use ABE on L, RGB", type : 'B' },
      skip_color_calibration: { val: false, def: false, name : "No color calibration", type : 'B' },
      color_calibration_before_ABE: { val: false, def: false, name : "Color calibration before ABE", type : 'B' },
      use_background_neutralization: { val: false, def: false, name : "Background neutralization", type : 'B' },
      use_imageintegration_ssweight: { val: false, def: false, name : "ImageIntegration use SSWEIGHT", type : 'B' },
      skip_noise_reduction: { val: false, def: false, name : "No noise reduction", type : 'B' },
      skip_mask_contrast: { val: false, def: false, name : "No mask contrast", type : 'B' },
      skip_sharpening: { val: false, def: false, name : "No sharpening", type : 'B' },

      // Other parameters
      calibrate_only: { val: false, def: false, name : "Calibrate only", type : 'B' },
      image_weight_testing: { val: false, def: false, name : "Image weight testing", type : 'B' },
      integrate_only: { val: false, def: false, name : "Integrate only", type : 'B' },
      channelcombination_only: { val: false, def: false, name : "ChannelCombination only", type : 'B' },
      RRGB_image: { val: false, def: false, name : "RRGB", type : 'B' },
      batch_mode: { val: false, def: false, name : "Batch mode", type : 'B' },
      skip_autodetect_filter: { val: false, def: false, name : "Do not autodetect FILTER keyword", type : 'B' },
      skip_autodetect_imagetyp: { val: false, def: false, name : "Do not autodetect IMAGETYP keyword", type : 'B' },
      select_all_files: { val: false, def: false, name : "Select all files", type : 'B' },
      save_all_files: { val: false, def: false, name : "Save all files", type : 'B' },
      no_subdirs: { val: false, def: false, name : "No subdirectories", type : 'B' },
      use_drizzle: { val: false, def: false, name : "Drizzle", type : 'B' },
      keep_integrated_images: { val: false, def: false, name : "Keep integrated images", type : 'B' },
      keep_temporary_images: { val: false, def: false, name : "Keep temporary images", type : 'B' },
      monochrome_image: { val: false, def: false, name : "Monochrome", type : 'B' },
      skip_imageintegration_clipping: { val: false, def: false, name : "No ImageIntegration clipping", type : 'B' },
      synthetic_l_image: { val: false, def: false, name : "Synthetic L", type : 'B' },
      synthetic_missing_images: { val: false, def: false, name : "Synthetic missing image", type : 'B' },
      force_file_name_filter: { val: false, def: false, name : "Use file name for filters", type : 'B' },
      unique_file_names: { val: false, def: false, name : "Unique file names", type : 'B' },
      use_starxterminator: { val: false, def: false, name : "Use StarXTerminator", type : 'B' },
      win_prefix_to_log_files: { val: false, def: false, name : "Add window prefix to log files", type : 'B' },
      start_from_imageintegration: { val: false, def: false, name : "Start from ImageIntegration", type : 'B' },
      generate_xdrz: { val: false, def: false, name : "Generate .xdrz files", type : 'B' },
            
      // Narrowband processing
      custom_R_mapping: { val: 'S', def: 'S', name : "Narrowband R mapping", type : 'S' },
      custom_G_mapping: { val: 'H', def: 'H', name : "Narrowband G mapping", type : 'S' },
      custom_B_mapping: { val: 'O', def: 'O', name : "Narrowband B mapping", type : 'S' },
      custom_L_mapping: { val: 'L', def: 'L', name : "Narrowband L mapping", type : 'S' },
      narrowband_linear_fit: { val: 'Auto', def: 'Auto', name : "Narrowband linear fit", type : 'S' },
      mapping_on_nonlinear_data: { val: false, def: false, name : "Narrowband mapping on non-linear data", type : 'B' },
      remove_stars_early: { val: false, def: false, name : "Remove stars early", type : 'B' },

      // Narrowband to RGB mapping
      use_RGBNB_Mapping: { val: false, def: false, name : "Narrowband RGB mapping", type : 'B' },
      use_RGB_image: { val: false, def: false, name : "Narrowband RGB mapping use RGB", type : 'B' },
      L_mapping: { val: '',  def: '',  name : "Narrowband RGB mapping for L", type : 'S' },
      R_mapping: { val: 'H', def: 'H', name : "Narrowband RGB mapping for R", type : 'S' },
      G_mapping: { val: 'O', def: 'O', name : "Narrowband RGB mapping for G", type : 'S' },
      B_mapping: { val: 'O', def: 'O', name : "Narrowband RGB mapping for B", type : 'S' },
      L_BoostFactor: { val: 1.2, def: 1.2, name : "Narrowband RGB mapping L boost factor", type : 'R' },
      R_BoostFactor: { val: 1.2, def: 1.2, name : "Narrowband RGB mapping R boost factor", type : 'R' },
      G_BoostFactor: { val: 1.2, def: 1.2, name : "Narrowband RGB mapping G boost factor", type : 'R' },
      B_BoostFactor: { val: 1.2, def: 1.2, name : "Narrowband RGB mapping B boost factor", type : 'R' },
      L_bandwidth: { val: 100, def: 100, name : "Narrowband RGB mapping L bandwidth", type : 'R' },
      R_bandwidth: { val: 100, def: 100, name : "Narrowband RGB mapping R bandwidth", type : 'R' },
      G_bandwidth: { val: 100, def: 100, name : "Narrowband RGB mapping G bandwidth", type : 'R' },
      B_bandwidth: { val: 100, def: 100, name : "Narrowband RGB mapping B bandwidth", type : 'R' },
      H_bandwidth: { val: 3, def: 3, name : "Narrowband RGB mapping H bandwidth", type : 'R' },
      S_bandwidth: { val: 3, def: 3, name : "Narrowband RGB mapping S bandwidth", type : 'R' },
      O_bandwidth: { val: 3, def: 3, name : "Narrowband RGB mapping O bandwidth", type : 'R' },

      // Processing settings
      noise_reduction_strength: { val: 3, def: 3, name : "Noise reduction strength", type : 'I' },
      luminance_noise_reduction_strength: { val: 3, def: 3, name : "Noise reduction strength on luminance image", type : 'I' },
      combined_image_noise_reduction: { val: false, def: false, name : "Do noise reduction on combined image", type : 'B' },
      use_color_noise_reduction: { val: false, def: false, name : "Color noise reduction", type : 'B' },
      ACDNR_noise_reduction: { val: 1.0, def: 1.0, name : "ACDNR noise reduction", type : 'R' },
      use_weight: { val: 'Generic', def: 'Generic', name : "Weight calculation", type : 'S' },
      ssweight_limit: { val: 0, def: 0, name : "SSWEIGHT limit", type : 'I' },
      outliers_ssweight: { val: false, def: false, name : "Outliers SSWEIGHT", type : 'B' },
      outliers_fwhm: { val: false, def: false, name : "Outliers FWHM", type : 'B' },
      outliers_ecc: { val: false, def: false, name : "Outliers eccentricity", type : 'B' },
      outliers_snr: { val: false, def: false, name : "Outliers SNR", type : 'B' },
      outliers_psfsignal: { val: false, def: false, name : "Outliers PSF Signal", type : 'B' },
      outliers_psfpower: { val: false, def: false, name : "Outliers PSF Power", type : 'B' },
      outliers_stars: { val: false, def: false, name : "Outliers Stars", type : 'B' },
      outliers_method: { val: 'Two sigma', def: 'Two sigma', name : "Outlier method", type : 'S' },
      outliers_minmax: { val: false, def: false, name : "Outlier min max", type : 'B' },
      use_linear_fit: { val: 'Luminance', def: 'Luminance', name : "Linear fit", type : 'S' },
      image_stretching: { val: 'Auto STF', def: 'Auto STF', name : "Image stretching", type : 'S' },
      STF_linking: { val: 'Auto', def: 'Auto', name : "RGB channel linking", type : 'S' },
      imageintegration_normalization: { val: 'Additive', def: 'Additive', name : "ImageIntegration Normalization", type : 'S' },
      use_clipping: { val: 'Auto2', def: 'Auto2', name : "ImageIntegration rejection", type : 'S' },
      cosmetic_correction_hot_sigma: { val: 3, def: 3, name : "CosmeticCorrection hot sigma", type : 'I' },
      cosmetic_correction_cold_sigma: { val: 3, def: 3, name : "CosmeticCorrection cold sigma", type : 'I' },
      STF_targetBackground: { val: 0.25, def: 0.25, name : "STF targetBackground", type : 'R' },    
      MaskedStretch_targetBackground: { val: 0.125, def: 0.125, name : "Masked Stretch targetBackground", type : 'R' },    
      LRGBCombination_lightness: { val: 0.5, def: 0.5, name : "LRGBCombination lightness", type : 'R' },    
      LRGBCombination_saturation: { val: 0.5, def: 0.5, name : "LRGBCombination saturation", type : 'R' },    
      linear_increase_saturation: { val: 1, def: 1, name : "Linear saturation increase", type : 'I' },    
      non_linear_increase_saturation: { val: 1, def: 1, name : "Non-linear saturation increase", type : 'I' },    
      Hyperbolic_D: { val: 10, def: 10, name : "Hyperbolic Stretch D value", type : 'I' },
      Hyperbolic_b: { val: 2, def: 2, name : "Hyperbolic Stretch b value", type : 'I' }, 
      Hyperbolic_iterations: { val: 1, def: 1, name : "Hyperbolic Stretch iterations", type : 'I' }, 

      // Extra processing for narrowband
      run_hue_shift: { val: false, def: false, name : "Extra narrowband more orange", type : 'B' },
      leave_some_green: { val: false, def: false, name : "Extra narrowband leave some green", type : 'B' },
      run_narrowband_SCNR: { val: false, def: false, name : "Extra narrowband remove green", type : 'B' },
      fix_narrowband_star_color: { val: false, def: false, name : "Extra narrowband fix star colors", type : 'B' },
      skip_star_fix_mask: { val: false, def: false, name : "Extra narrowband no star mask", type : 'B' },

      // Generic Extra processing
      extra_remove_stars: { val: false, def: false, name : "Extra remove stars", type : 'B' },
      extra_ABE: { val: false, def: false, name : "Extra ABE", type : 'B' },
      extra_darker_background: { val: false, def: false, name : "Extra Darker background", type : 'B' },
      extra_HDRMLT: { val: false, def: false, name : "Extra HDRMLT", type : 'B' },
      extra_LHE: { val: false, def: false, name : "Extra LHE", type : 'B' },
      extra_contrast: { val: false, def: false, name : "Extra contrast", type : 'B' },
      extra_contrast_iterations: { val: 1, def: 1, name : "Extra contrast iterations", type : 'I' },
      extra_stretch: { val: false, def: false, name : "Extra stretch", type : 'B' },
      
      extra_noise_reduction: { val: false, def: false, name : "Extra noise reduction", type : 'B' },
      extra_noise_reduction_strength: { val: 3, def: 3, name : "Extra noise reduction strength", type : 'I' },
      extra_smaller_stars: { val: false, def: false, name : "Extra smaller stars", type : 'B' },
      extra_smaller_stars_iterations: { val: 1, def: 1, name : "Extra smaller stars iterations", type : 'I' },

      // Calibration settings
      debayerPattern: { val: "Auto", def: "Auto", name : "Debayer", type : 'S' },
      extract_channel_mapping: { val: "", def: "", name : "Extract channel mapping", type : 'S' },
      create_superbias: { val: true, def: true, name : "Superbias", type : 'B' },
      pre_calibrate_darks: { val: false, def: false, name : "Pre-calibrate darks", type : 'B' },
      optimize_darks: { val: true, def: true, name : "Optimize darks", type : 'B' },
      stars_in_flats: { val: false, def: false, name : "Stars in flats", type : 'B' },
      no_darks_on_flat_calibrate: { val: false, def: false, name : "Do not use darks on flats", type : 'B' },
      lights_add_manually: { val: false, def: false, name : "Add lights manually", type : 'B' },
      flats_add_manually: { val: false, def: false, name : "Add flats manually", type : 'B' },
      skip_blink: { val: false, def: false, name : "No blink", type : 'B' },

      // Old persistent settings, moved to generic settings
      start_with_empty_window_prefix: { val: false, def: false, name: "startWithEmptyPrefixName", type: 'B' }, // Do we always start with empty prefix
      use_manual_icon_column: { val: false, def: false, name: "manualIconColumn", type: 'B' }                  // Allow manual control of icon column
};

/*
      Parameters that are persistent and are saved to only Aettings and
      restored only from Settings at the start.
      Note that there is another parameter set par which are saved to 
      process icon.
*/
var ppar = {
      win_prefix: '',         // Current active window name prefix
      prefixArray: [],        // Array of prefix names and icon count, 
                              // every array element is [icon-column, prefix-name, icon-count]
      userColumnCount: -1     // User set column position, if -1 use automatic column position
};

var debayerPattern_values = [ "Auto", "RGGB", "BGGR", "GBRG", 
                              "GRBG", "GRGB", "GBGR", "RGBG", 
                              "BGRG", "None" ];
var debayerPattern_enums = [ Debayer.prototype.Auto, Debayer.prototype.RGGB, Debayer.prototype.BGGR, Debayer.prototype.GBRG,
                             Debayer.prototype.GRBG, Debayer.prototype.GRGB, Debayer.prototype.GBGR, Debayer.prototype.RGBG,
                             Debayer.prototype.BGRG, Debayer.prototype.Auto ];
var extract_channel_mapping_values = [ "", "LRGB", "HSO", "HOS" ];
var RGBNB_mapping_values = [ 'H', 'S', 'O', '' ];
var use_weight_values = [ 'Generic', 'Noise', 'Stars', 'PSF Signal', 'PSF Signal scaled', 'FWHM scaled', 'Eccentricity scaled', 'SNR scaled', 'Star count' ];
var outliers_methods = [ 'Two sigma', 'One sigma', 'IQR' ];
var use_linear_fit_values = [ 'Luminance', 'Red', 'Green', 'Blue', 'No linear fit' ];
var image_stretching_values = [ 'Auto STF', 'Masked Stretch', 'Use both', 'Hyperbolic' ];
var use_clipping_values = [ 'Auto1', 'Auto2', 'Percentile', 'Sigma', 'Winsorised sigma', 'Averaged sigma', 'Linear fit', 'EDS' ]; 
var narrowband_linear_fit_values = [ 'Auto', 'H', 'S', 'O', 'None' ];
var STF_linking_values = [ 'Auto', 'Linked', 'Unlinked' ];
var imageintegration_normalization_values = [ 'Additive', 'Adaptive', 'None' ];
var noise_reduction_strength_values = [ '0', '2', '3', '4', '5', '6'];
var column_count_values = [ 'Auto', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
                            '11', '12', '13', '14', '15', '16', '17', '18', '19', '20' ];
var binning_values = [ 'None', 'Color', 'L and color'];

var blink_window = null;
var blink_zoom = false;
var saved_measurements = null;

var close_windows = false;
var same_stf_for_all_images = false;            /* does not work, colors go bad */
var ssweight_set = false;
var run_HT = true;
var batch_narrowband_palette_mode = false;
var narrowband = false;
var autocontinue_narrowband = false;
var linear_fit_done = false;
var is_luminance_images = false;    // Do we have luminance files from autocontinue or FITS
var run_auto_continue = false;
var use_force_close = true;
var write_processing_log_file = true;  // if we fail very early we set this to false

var processingDate;
var outputRootDir = "";
var lightFileNames = null;
var darkFileNames = null;
var biasFileNames = null;
var flatdarkFileNames = null;
var flatFileNames = null;
var best_ssweight = 0;
var best_image = null;

var L_images;
var R_images;
var G_images;
var B_images;
var H_images;
var S_images;
var O_images;
var C_images;

var extra_target_image = null;

var processing_steps = "";
var all_windows = [];
var iconPoint;
var iconStartRow = 0;   // Starting row for icons, AutoContinue start from non-zero position
var logfname;

var filterSectionbars = [];
var filterSectionbarcontrols = [];
var lightFilterSet = null;
var flatFilterSet = null;
    
// These are initialized by setDefaultDirs
var AutoOutputDir = null;
var AutoCalibratedDir = null;
var AutoMasterDir = null;
var AutoProcessedDir = null;

/* Variable used during processing images.
 */
var alignedFiles;
var mask_win;
var mask_win_id;
var star_mask_win;
var star_mask_win_id;
var star_fix_mask_win;
var star_fix_mask_win_id;
var RGB_win;
var RGB_win_id;
var is_color_files = false;
var preprocessed_images;
var L_ABE_id;
var L_ABE_HT_win;
var L_ABE_HT_id;
var L_HT_win;
var RGB_ABE_id;

var luminance_id = null;      // These are working images and copies of 
var red_id = null;            // original integrated images
var green_id = null;
var blue_id = null;

var L_id;                     // Original integrated images
var R_id;
var G_id;
var B_id;
var H_id;
var S_id;
var O_id;

var RGBcolor_id;
var R_ABE_id = null;
var G_ABE_id = null;
var B_ABE_id = null;
var start_time;
var L_BE_win;
var R_BE_win;
var G_BE_win;
var B_BE_win;
var H_BE_win;
var S_BE_win;
var O_BE_win;
var RGB_BE_win;
var L_HT_win;
var L_stf;
var RGB_HT_win;
var range_mask_win;
var final_win;
var start_images = {
      NONE : 0,
      L_R_G_B_BE : 1,
      L_RGB_BE : 2,
      RGB_BE : 3,
      L_RGB_HT : 4,
      RGB_HT : 5,
      RGB_COLOR : 6,
      L_R_G_B : 7,
      FINAL : 8,
      CALIBRATE_ONLY : 9
};

var channels = {
      L: 0,
      R: 1,
      G: 2,
      B: 3,
      H: 4,
      S: 5,
      O: 6,
      C: 7
};

var pages = {
      LIGHTS : 0,
      BIAS : 1,
      DARKS : 2,
      FLATS : 3,
      FLAT_DARKS : 4,
      END : 5
};

var columnCount = 0;          // A column position
var haveIconized = 0;

// known window names
var integration_LRGB_windows = [
      "Integration_L",  // must be first
      "Integration_R",
      "Integration_G",
      "Integration_B",
      "Integration_H",
      "Integration_S",
      "Integration_O"
];

var integration_color_windows = [
      "Integration_RGB"
];

var fixed_windows = [
      "Mapping_L",
      "Mapping_R",
      "Mapping_G",
      "Mapping_B",
      "Integration_L_ABE",
      "Integration_R_ABE",
      "Integration_G_ABE",
      "Integration_B_ABE",
      "Integration_RGB_ABE",
      "Integration_L_BE",
      "Integration_R_BE",
      "Integration_G_BE",
      "Integration_B_BE",
      "Integration_RGB_BE",
      "Integration_RGB_ABE_NB",
      "Integration_L_ABE_HT",
      "Integration_RGB_ABE_HT",
      "Integration_L_BE_HT",
      "Integration_RGB_BE_HT",
      "copy_Integration_RGB_ABE_HT",
      "Integration_RGB_ABE_NB_HT",
      "copy_Integration_RGB_ABE_NB_HT",
      "Integration_LRGB_ABE_HT",
      "copy_Integration_LRGB_ABE_HT",
      "Integration_L_noABE",
      "Integration_R_noABE",
      "Integration_G_noABE",
      "Integration_B_noABE",
      "Integration_RGB_noABE",
      "Integration_RGB_noABE_NB",
      "Integration_L_noABE_HT",
      "Integration_L_noABE_NB",
      "Integration_L_noABE_NB_HT",
      "Integration_RGB_noABE_HT",
      "copy_Integration_RGB_noABE_HT",
      "Integration_RGB_noABE_NB_HT",
      "Integration_LRGB_noABE_HT",
      "copy_Integration_LRGB_noABE_HT",
      "Integration_LRGB_noABE_NB_HT",
      "copy_Integration_LRGB_noABE_NB_HT",
      "L_BE_HT",
      "RGB_BE_HT",
      "AutoMask",
      "AutoStarMask",
      "AutoStarFixMask",
      "SubframeSelector",
      "Measurements",
      "Expressions",
      "L_win_mask",
      "Integration_L_map_pm_ABE",
      "Integration_L_map_pm_noABE",
      "Integration_L_map_pm_ABE_HT",
      "Integration_L_map_pm_noABE_HT"
];

var calibrate_windows = [
      "AutoMasterBias",
      "AutoMasterSuperBias",
      "AutoMasterFlatDark",
      "AutoMasterDark",
      "AutoMasterFlat_L",
      "AutoMasterFlat_R",
      "AutoMasterFlat_G",
      "AutoMasterFlat_B",
      "AutoMasterFlat_H",
      "AutoMasterFlat_S",
      "AutoMasterFlat_O",
      "AutoMasterFlat_C"
];

/* Final processed window names, depending on input data and options used.
 * These may have Drizzle prefix if that option is used.
 */
var final_windows = [
      "AutoLRGB",
      "AutoRRGB",
      "AutoRGB",
      "AutoMono"
];

var narrowBandPalettes = [
      { name: "SHO", R: "S", G: "H", B: "O", all: true }, 
      { name: "HOS", R: "H", G: "O", B: "S", all: true }, 
      { name: "HSO", R: "H", G: "S", B: "O", all: true }, 
      { name: "HOO", R: "H", G: "O", B: "O", all: true }, 
      { name: "Pseudo RGB", R: "0.75*H + 0.25*S", G: "0.50*S + 0.50*O", B: "0.30*H + 0.70*O", all: true }, 
      { name: "Natural HOO", R: "H", G: "0.8*O+0.2*H", B: "0.85*O + 0.15*H", all: true }, 
      { name: "3-channel HOO", R: "0.76*H+0.24*S", G: "O", B: "0.85*O + 0.15*H", all: true }, 
      { name: "Dynamic SHO", R: "(O^~O)*S + ~(O^~O)*H", G: "((O*H)^~(O*H))*H + ~((O*H)^~(O*H))*O", B: "O", all: true }, 
      { name: "Dynamic HOO", R: "H", G: "((O*H)^~(O*H))*H + ~((O*H)^~(O*H))*O", B: "O", all: true }, 
      { name: "max(RGB,H)", R: "max(R, H)", G: "G", B: "B", all: false }, 
      { name: "max(RGB,HOO)", R: "max(R, H)", G: "max(G, O)", B: "max(B, O)", all: false }, 
      { name: "HOO Helix", R: "H", G: "(0.4*H)+(0.6*O)", B: "O", all: true }, 
      { name: "HSO Mix 1", R: "0.4*H + 0.6*S", G: "0.7*H + 0.3*O", B: "O", all: true }, 
      { name: "HSO Mix 2", R: "0.4*H + 0.6*S", G: "0.4*O + 0.3*H + 0.3*S", B: "O", all: true }, 
      { name: "HSO Mix 3", R: "0.5*H + 0.5*S", G: "0.15*H + 0.85*O", B: "O", all: true }, 
      { name: "HSO Mix 4", R: "0.5*H + 0.5*S", G: "0.5*H + 0.5*O", B: "O", all: true }, 
      { name: "L-eXtreme SHO", R: "H", G: "0.5*H+0.5*max(S,O)", B: "max(S,O)", all: false }, 
      { name: "RGB", R: "R", G: "G", B: "B", all: false }, 
      { name: "User defined", R: "", G: "", B: "", all: false },
      { name: "All", R: "All", G: "All", B: "All", all: false }
];

// Create a table of known prefix names for toolTip
// Also update window prefix combo box list
function setWindowPrefixHelpTip(default_prefix)
{
      var prefix_list = "<table><tr><th>Col</th><th>Name</th><th>Icon count</th></tr>";
      for (var i = 0; i < ppar.prefixArray.length; i++) {
            if (ppar.prefixArray[i] != null && ppar.prefixArray[i][1] != '-') {
                  prefix_list = prefix_list + "<tr><td>" + (ppar.prefixArray[i][0] + 1) + '</td><td>' + ppar.prefixArray[i][1] + '</td><td>' + ppar.prefixArray[i][2] + '</td></tr>';
            }
      }
      prefix_list = prefix_list + "</table>";
      windowPrefixHelpTips.toolTip = "<p>Current Window Prefixes:</p><p> " + prefix_list + "</p>";
      closeAllPrefixButton.toolTip = "<p>Use all known window prefixes to close all image windows that are created by this script.</p>" +
                                     "<p>Prefixes used to close windows are default empty prefix, prefix in the Window Prefix box and all saved window prefixes. " +
                                     "All saved prefix information is cleared after this operation.</p>" +
                                     "<p>To close windows with current prefix use Close all button.</p>" +
                                     windowPrefixHelpTips.toolTip;

      windowPrefixComboBox.clear();
      var pa = get_win_prefix_combobox_array(default_prefix);
      addArrayToComboBox(windowPrefixComboBox, pa);
      windowPrefixComboBox.editText = validateWindowPrefix(ppar.win_prefix);
      windowPrefixComboBox.currentItem = pa.indexOf(validateWindowPrefix(ppar.win_prefix));
}

function fix_win_prefix_array()
{
      var new_prefix_array = [];

      for (var i = 0; i < ppar.prefixArray.length; i++) {
            if (ppar.prefixArray[i] == null) {
                  continue;
            } else if (!Array.isArray(ppar.prefixArray[i])) {
                  // bug fix, mark as free
                  continue;
            } else if (ppar.prefixArray[i][1] != '-') {
                  new_prefix_array[new_prefix_array.length] = ppar.prefixArray[i];
            }
      }
      ppar.prefixArray = new_prefix_array;
}

function get_win_prefix_combobox_array(default_prefix)
{
      default_prefix = validateWindowPrefix(default_prefix);
      var name_array = [default_prefix];

      for (var i = 0; i < ppar.prefixArray.length; i++) {
            if (ppar.prefixArray[i] != null && ppar.prefixArray[i][1] != '-') {
                  var add_name = validateWindowPrefix(ppar.prefixArray[i][1]);
                  if (add_name != default_prefix) {
                        name_array[name_array.length] = add_name;
                  }
            }
      }
      return name_array;
}

function ensure_win_prefix(id)
{
      if (ppar.win_prefix != "" && !id.startsWith(ppar.win_prefix)) {
            return ppar.win_prefix + id;
      } else {
            return id;
      }
}

// Find a prefix from the prefix array. Returns -1 if not
// found.
function findPrefixIndex(prefix)
{
      for (var i = 0; i < ppar.prefixArray.length; i++) {
            if (ppar.prefixArray[i][1] == prefix) {
                  return i;
            }
      }
      return -1;
}

// Find a new free column position for a prefix. Prefix name '-'
// is used to mark a free position.
function findNewPrefixIndex(find_free_column)
{
      if (find_free_column) {
            /* First mark all reserved column positions. */
            var reserved_columns = [];
            for (var i = 0; i < ppar.prefixArray.length; i++) {
                  if (ppar.prefixArray[i][1] != '-') {
                        reserved_columns[ppar.prefixArray[i][0]] = true;
                  }
            }
            /* Then find first unused column position. */
            for (var i = 0; i < reserved_columns.length; i++) {
                  if (reserved_columns[i] != true) {
                        break;
                  }
            }
            var index = ppar.prefixArray.length;
            ppar.prefixArray[index] = [i, '-', 0];
            return index;
      } else {
            // Just return a new slot at the end of the array
            var index = ppar.prefixArray.length;
            ppar.prefixArray[index] = [0, '-', 0];
            return index;
      }
}

// Save persistent settings
function savePersistentSettings()
{
      Settings.write (SETTINGSKEY + "/prefixName", DataType_String, ppar.win_prefix);
      Settings.write (SETTINGSKEY + "/prefixArray", DataType_String, JSON.stringify(ppar.prefixArray));
      if (par.use_manual_icon_column.val) {
            Settings.write (SETTINGSKEY + "/columnCount", DataType_Int32, ppar.userColumnCount);
      }
      setWindowPrefixHelpTip(ppar.win_prefix);
}

function fixWindowArray(arr, prev_prefix, cur_prefix)
{
    if (prev_prefix != "") {
        // in this situation we've fixed up the array at least once, but the user changed the prefix
        // in the UI and so the old prefix must be removed from the array before prepending the new one.

        for (var i = 0; i < arr.length; i++) {
            // console.writeln(" AINew fixWindowArray: removing prefix " + prev_prefix + " from "  + arr[i]);
            arr[i] = arr[i].substring(arr[i].indexOf(prev_prefix.toString()) + prev_prefix.length);
            // console.writeln(" AINew remaining is " + arr[i]);
        }
    }

    // add the window prefix to the array.

    for (var i = 0; i < arr.length; i++) {
        // console.writeln(" AINew fixWindowArray: prepending prefix " + cur_prefix + " to " + arr[i]);
        arr[i] = cur_prefix + arr[i];
    }

}

// Fix all fixed window names by having the given prefix
// We find possible previous prefix from the known fixed
// window name
function fixAllWindowArrays(new_prefix)
{
      var basename = "Integration_L";
      var curname = integration_LRGB_windows[0];
      var old_prefix = curname.substring(0, curname.length - basename.length);
      if (old_prefix == new_prefix) {
            // no change
            console.writeln("fixAllWindowArrays no change in prefix '" + new_prefix + "'");
            return;
      }
      console.writeln("fixAllWindowArrays set new prefix '" + new_prefix + "'");
      fixWindowArray(integration_LRGB_windows, old_prefix, new_prefix);
      fixWindowArray(integration_color_windows, old_prefix, new_prefix);
      fixWindowArray(fixed_windows, old_prefix, new_prefix);
      fixWindowArray(calibrate_windows, old_prefix, new_prefix);
      fixWindowArray(final_windows, old_prefix, new_prefix);
}

/// Init filter sets. We used to have actual Set object but
// use a simple array so we can add object into it.
// There are file sets for each possible filters and
// each array element has file name and used flag.
function initFilterSets()
{
      return [
            ['L', []],
            ['R', []],
            ['G', []],
            ['B', []],
            ['H', []],
            ['S', []],
            ['O', []],
            ['C', []]
      ];
}

// find filter set object based on file type
function findFilterSet(filterSet, filetype)
{
      for (var i = 0; i < filterSet.length; i++) {
            if (filterSet[i][0] == filetype) {
                  return filterSet[i][1];
            }
      }
      throwFatalError("findFilterSet bad filetype " + filetype);
      return null;
}

// Add file base name to the filter set object
// We use file base name to detect filter files
function addFilterSetFile(filterSet, filePath, filetype)
{
      var basename = File.extractName(filePath);
      console.writeln("addFilterSetFile add " + basename + " filter "+ filetype);
      filterSet[filterSet.length] = { name: basename, used: false };
}

// Try to find base file name from filter set objects.
// We use simple linear search which should be fine
// for most data sizes.
function findFilterForFile(filterSet, filePath, filename_postfix)
{
      var basename = File.extractName(filePath);
      if (filename_postfix.length > 0) {
            // strip filename_postfix from the end
            basename = basename.slice(0, basename.length - filename_postfix.length);
      }
      console.writeln("findFilterForFile " + basename);
      for (var i = 0; i < filterSet.length; i++) {
            var filterFileSet = filterSet[i][1];
            for (j = 0; j < filterFileSet.length; j++) {
                  if (!filterFileSet[j].used && filterFileSet[j].name == basename) {
                        console.writeln("findFilterForFile filter " + filterSet[i][0]);
                        filterFileSet[j].used = true;
                        return filterSet[i][0];
                  }
            }
      }
      return null;
}

function clearFilterFileUsedFlags(filterSet)
{
      console.writeln("clearUsedFilterForFiles");
      for (var i = 0; i < filterSet.length; i++) {
            var filterFileSet = filterSet[i][1];
            for (j = 0; j < filterFileSet.length; j++) {
                  filterFileSet[j].used = false;
            }
      }
      return null;
}

function setDefaultDirs()
{
      AutoOutputDir = "AutoOutput";
      AutoCalibratedDir = "AutoCalibrated";
      AutoMasterDir = "AutoMaster";
      AutoProcessedDir = "AutoProcessed";
}

function clearDefaultDirs()
{
      AutoOutputDir = ".";
      AutoCalibratedDir = ".";
      AutoMasterDir = ".";
      AutoProcessedDir = ".";
}

function getProcessingOptions()
{
      var options = [];
      for (let x in par) {
            var param = par[x];
            if (param.val != param.def) {
                  options[options.length] = [ param.name, param.val ];
            }
      }
      return options;
}

function addProcessingStep(txt)
{
      console.noteln("AutoIntegrate: " + txt);
      processing_steps = processing_steps + "\n" + txt;
}

function ensurePathEndSlash(dir)
{
      if (dir.length > 0) {
            switch (dir[dir.length-1]) {
                  case '/':
                  case '\\':
                        return dir;
                  default:
                        return dir + '/';
            }
      }
      return dir;
}

function removePathEndSlash(dir)
{
      if (dir.length > 1) {
            switch (dir[dir.length-1]) {
                  case '/':
                  case '\\':
                        return dir.slice(0, -1);
                  default:
                        return dir;
            }
      }
      return dir;
}

function removePathEndDot(dir)
{
      if (dir.length > 0) {
            switch (dir.substr(-2, 2)) {
                  case '/.':
                  case '\\.':
                        return dir.slice(0, -2);
                  default:
                        return dir;
            }
      }
      return dir;
}

// parse full path from file name appended with '/
function parseNewOutputDir(filePath, subdir)
{
      var path = ensurePathEndSlash(File.extractDrive(filePath) + File.extractDirectory(filePath));
      path = ensurePathEndSlash(path + subdir);
      console.writeln("parseNewOutputDir " + path);
      return path;
}

// If path is relative and not absolute, we append it to the 
// path of the image file
function pathIsRelative(p)
{
      var dir = File.extractDirectory(p);
      switch (dir[0]) {
            case '/':
            case '\\':
                  return false;
            default:
                  return true;
      }
}

function throwFatalError(txt)
{
      addProcessingStep(txt);
      throw new Error(txt);
}

function winIsValid(w)
{
      return w != null;
}

function getOutputDir(filePath)
{
      var outputDir = outputRootDir;
      if (outputRootDir == "" || pathIsRelative(outputRootDir)) {
            if (filePath != null && filePath != "") {
                  outputDir = parseNewOutputDir(filePath, outputRootDir);
                  console.writeln("getOutputDir, outputDir ", outputDir);
            } else {
                  outputDir = "";
                  console.writeln("outputDir empty filePath");
            }
      }
      return outputDir;
}

function checkWinFilePath(w)
{
      outputRootDir = getOutputDir(w.filePath);
}

function checkAutoCont(w)
{
      if (winIsValid(w))  {
            checkWinFilePath(w);
            return true;
      } else {
            return false;
      }
}

function findWindow(id)
{
      if (id == null || id == undefined) {
            return null;
      }
      var images = ImageWindow.windows;
      if (images == null || images == undefined) {
            return null;
      }
      for (var i in images) {
            if (images[i].mainView != null
                && images[i].mainView != undefined
                && images[i].mainView.id == id) 
            {
               return images[i];
            }
      }
      return null;
}


function closeAllWindowsSubstr(id_substr)
{
      var images = ImageWindow.windows;
      if (images == null || images == undefined) {
            return;
      }
      for (var i in images) {
            if (images[i].mainView != null
                && images[i].mainView != undefined
                && images[i].mainView.id.indexOf(id_substr) != -1) 
            {
               images[i].close;
            }
      }
}

function getWindowList()
{
      var windowList = [];
      var images = ImageWindow.windows;
      if (images == null || images == undefined) {
            return windowList;
      }
      for (var i in images) {
            try {
                  if (images[i].mainView != null && images[i].mainView != undefined) {
                        windowList[windowList.length] = images[i].mainView.id;
                  }
            } catch (err) {
                  // ignore errors
            }
      }
      return windowList;
}

function getWindowListReverse()
{
      var windowListReverse = [];
      var windowList = getWindowList();
      for (var i = windowList.length-1; i >= 0; i--) {
            windowListReverse[windowListReverse.length] = windowList[i];
      }
      return windowListReverse;
}

function findWindowId(id)
{
      var w = findWindow(id);

      if (w == null) {
            return null;
      }

      return w.mainView.id;
}

function windowCloseif(id)
{
      var w = findWindow(id);
      if (w != null) {
            if (par.keep_temporary_images.val) {
                  w.mainView.id = "tmp_" + w.mainView.id;
                  w.show();
                  console.writeln("Rename window to " + w.mainView.id);
            } else {
                  w.close();
            }
      }
}

function windowShowif(id)
{
      var w = findWindow(id);
      if (w != null) {
            w.show();
      }
}

function windowIconizeAndKeywordif(id)
{
      if (id == null) {
            return;
      }
      var w = findWindow(id);

      if (w != null) {
            /* Method iconize() will put the icon at the middle position
               of the window. To get icons to the top left corner we
               first move the window middle position there to get
               the icon at the right position. Then we restore the 
               window position back to old position.
            */
            var oldpos = new Point(w.position);  // save old position
            if (iconPoint == null) {
                  /* Get first icon to upper left corner. */
                  iconPoint = new Point(
                                    -(w.width / 2) + 5 + columnCount*300,
                                    -(w.height / 2) + 5 + iconStartRow * 32);
                  //addProcessingStep("Icons start from position " + iconPoint);
            } else {
                  /* Put next icons in a nice row below the first icon.
                  */
                  iconPoint.moveBy(0, 32);
            }
            w.position = new Point(iconPoint);  // set window position to get correct icon position
            w.iconize();
            w.position = oldpos;                // restore window position

            // Set processed image keyword. It will not overwrite old
            // keyword. If we later set a final image keyword it will overwrite
            // this keyword.
            setProcessedImageKeyword(w);
            haveIconized++;
      }
}

function windowRenameKeepifEx(old_name, new_name, keepif, allow_duplicate_name)
{
      var w = ImageWindow.windowById(old_name);
      w.mainView.id = new_name;
      if (!keepif) {
            addScriptWindow(new_name);
      }
      if (!allow_duplicate_name && w.mainView.id != new_name) {
            fatalWindowNameFailed("Window rename from " + old_name + " to " + new_name + " failed, name is " + w.mainView.id);
      }
      return w.mainView.id;
}

function windowRenameKeepif(old_name, new_name, keepif)
{
      return windowRenameKeepifEx(old_name, new_name, keepif, false);
}

function windowRename(old_name, new_name)
{
      return windowRenameKeepif(old_name, new_name, false);
}

// Add a script window that will be closed when close all is clicked
// Useful for temporary windows that do not have a fixed name
function addScriptWindow(name)
{
      all_windows[all_windows.length] = name;
}

function forceCloseOneWindow(w)
{
      if (par.keep_temporary_images.val) {
            w.mainView.id = "tmp_" + w.mainView.id;
            w.show();
            console.writeln("Rename window to " + w.mainView.id);
      } else if (use_force_close) {
            w.forceClose();
      } else {
            // PixInsight will ask if file is changed but not saved
            w.close();
      }
}

// close one window
function closeOneWindow(id)
{
      var w = findWindow(id);
      if (w != null) {
            forceCloseOneWindow(w);
      }
}

// close all windows from an array
function closeAllWindowsFromArray(arr)
{
      for (var i = 0; i < arr.length; i++) {
          //          console.writeln(" AINew Closing Window: " + arr[i]);
            closeOneWindow(arr[i]);
      }
}

// For the final window, we may have more different names with
// both prefix or postfix added
function closeFinalWindowsFromArray(arr)
{
      for (var i = 0; i < arr.length; i++) {
            closeOneWindow(arr[i]);
            closeOneWindow(arr[i]+"_extra");
            closeOneWindow(arr[i]+"_extra_starless");
            closeOneWindow(arr[i]+"_extra_stars");
      }
}

function closeTempWindowsForOneImage(id)
{
      closeOneWindow(id + "_max");
      closeOneWindow(id + "_map");
      closeOneWindow(id + "_map_mask");
      closeOneWindow(id + "_map_pm");
      closeOneWindow(id + "_mask");
      closeOneWindow(id + "_tmp");
}

function closeTempWindows()
{
      for (var i = 0; i < integration_LRGB_windows.length; i++) {
            closeTempWindowsForOneImage(integration_LRGB_windows[i]);
            closeTempWindowsForOneImage(integration_LRGB_windows[i] + "_BE");
      }
}

function findFromArray(arr, id)
{
      for (var i = 0; i < arr.length; i++) {
            if (arr[i] == id) {
                  return true;
            }
      }
      return false;
}

// close all windows created by this script
function closeAllWindows(keep_integrated_imgs, force_close)
{
      closeTempWindows();

      if (keep_integrated_imgs) {
            var isLRGB = false;
            var integration_windows = integration_LRGB_windows;
            for (var i = 0; i < integration_LRGB_windows.length; i++) {
                  if (findWindow(integration_LRGB_windows[i]) != null) {
                        // we have LRGB images
                        closeAllWindowsFromArray(integration_color_windows);
                        isLRGB = true;
                        break;
                  }
            }
            if (!isLRGB) {
                  // we have color image
                  closeAllWindowsFromArray(integration_LRGB_windows);
                  integration_windows = integration_color_windows
            }
            for (var i = 0; i < all_windows.length; i++) {
                  // check that we do not close integration windows
                  if (!findFromArray(integration_windows, all_windows[i])) {
                        closeOneWindow(all_windows[i]);
                  }
            }
      } else {
            closeAllWindowsFromArray(all_windows);
            closeAllWindowsFromArray(integration_LRGB_windows);
            closeAllWindowsFromArray(integration_color_windows);
      }
      closeAllWindowsFromArray(fixed_windows);
      closeAllWindowsFromArray(calibrate_windows);

      use_force_close = force_close;

      closeFinalWindowsFromArray(final_windows);

      use_force_close = true;

}

function ensureDir(dir)
{
      console.writeln("ensureDir " + dir)
      if (dir == "") {
            return;
      }
      var noslashdir = removePathEndSlash(dir);
      noslashdir = removePathEndDot(noslashdir);
      if (!File.directoryExists(noslashdir)) {
            console.writeln("Create directory " + noslashdir);
            File.createDirectory(noslashdir);
      }
}

function combinePath(p1, p2)
{
      if (p1 == "") {
            return "";
      } else {
            return p1 + p2;
      }
}

function saveWindowEx(path, id, optional_unique_part)
{
      if (path == null || id == null) {
            return null;
      }
      var fname = path + id + optional_unique_part + ".xisf";
      console.writeln("saveWindowEx " + fname);

      var w = ImageWindow.windowById(id);

      if (w == null) {
            return null;
      }

      // Save image. No format options, no warning messages, 
      // no strict mode, no overwrite checks.
      if (!w.saveAs(fname, false, false, false, false)) {
            throwFatalError("Failed to save image: " + fname);
      }
      return fname;
}

function saveProcessedWindow(path, id)
{
      if (path == "") {
            console.criticalln("No output directory, cannot save image "+ id);
            return;
      }
      var processedPath = combinePath(path, AutoProcessedDir);
      ensureDir(processedPath);
      saveWindowEx(ensurePathEndSlash(processedPath), id, getOptionalUniqueFilenamePart());
}

function saveMasterWindow(path, id)
{
      if (path == "") {
            throwFatalError("No output directory, cannot save image "+ id);
      }
      var masterDir = combinePath(path, AutoMasterDir);
      ensureDir(outputRootDir);
      ensureDir(masterDir);
      var fname = saveWindowEx(ensurePathEndSlash(masterDir), id, "");
      if (fname == null) {
            throwFatalError("Failed to save work image: " + ensurePathEndSlash(masterDir) + id);
      }
      return fname;
}

function saveFinalImageWindow(win, dir, name, bits)
{
      console.writeln("saveFinalImageWindow " + name);
      var copy_win = copyWindow(win, ensure_win_prefix(name + "_savetmp"));
      var save_name;

      // 8 and 16 bite are TIFF, 32 is XISF
      if (bits != 32) {
            if (bits == 16) {
                  var new_postfix = "";
            } else {
                  var new_postfix = "_" + bits;
            }
            var old_postfix = name.substr(name.length - new_postfix.length);
            if (old_postfix != new_postfix) {
                  save_name = ensurePathEndSlash(dir) + name + new_postfix + getOptionalUniqueFilenamePart() + ".tif";
            } else {
                  // we already have bits added to name
                  save_name = ensurePathEndSlash(dir) + name + getOptionalUniqueFilenamePart() + ".tif";
            }

            if (copy_win.bitsPerSample != bits) {
                  console.writeln("saveFinalImageWindow:set bits to " + bits);
                  copy_win.setSampleFormat(bits, false);
            }
      } else {
            save_name = ensurePathEndSlash(dir) + name + getOptionalUniqueFilenamePart() + ".xisf";
      }
      console.writeln("saveFinalImageWindow:save name " + name);
      // Save image. No format options, no warning messages, 
      // no strict mode, no overwrite checks.
      if (!copy_win.saveAs(save_name, false, false, false, false)) {
            throwFatalError("Failed to save image: " + outputPath);
      }
      forceCloseOneWindow(copy_win);
}

function saveAllFinalImageWindows(bits)
{
      console.writeln("saveAllFinalImageWindows");

      // Find a windows that has a keyword which tells this is
      // a final image file
      var images = ImageWindow.windows;
      var finalimages = [];
      for (var i in images) {
            var imageWindow = images[i];
            var keywords = imageWindow.keywords;
            if (keywords != null && keywords != undefined) {
                  for (var j = 0; j != keywords.length; j++) {
                        var keyword = keywords[j].name;
                        var value = keywords[j].strippedValue.trim();
                        if (par.save_all_files.val) {
                              var savefile = keyword == "AutoIntegrate" && (value == "finalimage" || value == "processedimage");
                        } else {
                              var savefile = keyword == "AutoIntegrate" && value == "finalimage";
                        }
                        if (savefile) {
                              // we need to save this image window 
                              if (imageWindow.mainView != null && imageWindow.mainView != undefined) {
                                    finalimages[finalimages.length] = imageWindow;
                              }
                              break;
                        }
                  }
            }
      }

      if (finalimages.length == 0) {
            console.noteln("No final images found");
            return;
      }

      var gdd = new GetDirectoryDialog;
      gdd.caption = "Select Final Image Save Directory";
      var filePath = finalimages[0].filePath;
      if (filePath != null) {
            gdd.initialPath = File.extractDrive(filePath) + File.extractDirectory(filePath);
      }

      if (gdd.execute()) {
            console.writeln("saveAllFinalImageWindows:dir " + gdd.directory);
            for (var i = 0; i < finalimages.length; i++) {
                  saveFinalImageWindow(finalimages[i], gdd.directory, finalimages[i].mainView.id, bits);
            }
      }
      console.writeln("All final image windows are saved!");
}

function fatalWindowNameFailed(txt)
{
      console.criticalln(txt);
      console.criticalln("Close old images or use a different window prefix.");
      throwFatalError("Processing stopped");
}

function copyWindowEx(sourceWindow, name, allow_duplicate_name)
{
      if (sourceWindow == null) {
            throwFatalError("Window not found, cannot copy to " + name);
      }
      var targetWindow = new ImageWindow(
                              sourceWindow.mainView.image.width,
                              sourceWindow.mainView.image.height,
                              sourceWindow.mainView.image.numberOfChannels,
                              sourceWindow.mainView.window.bitsPerSample,
                              sourceWindow.mainView.window.isFloatSample,
                              sourceWindow.mainView.image.colorSpace != ColorSpace_Gray,
                              name);
      targetWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      targetWindow.mainView.image.assign(sourceWindow.mainView.image);
      targetWindow.keywords = sourceWindow.keywords;
      targetWindow.mainView.endProcess();

      targetWindow.show();

      addScriptWindow(name);

      if (targetWindow.mainView.id != name && !allow_duplicate_name) {
            fatalWindowNameFailed("Failed to copy window to name " + name + ", copied window name is " + targetWindow.mainView.id);
      }

      console.writeln("copy window " + sourceWindow.mainView.id + " to " + name);

      return targetWindow;
}

function copyWindow(sourceWindow, name)
{
      return copyWindowEx(sourceWindow, name, false);
}

function extractLchannel(sourceWindow)
{
      var P = new ChannelExtraction;
      P.colorSpace = ChannelExtraction.prototype.CIELab;
      P.channels = [ // enabled, id
            [true, ""],       // L
            [false, ""],      // a
            [false, ""]       // b
      ];
      P.sampleFormat = ChannelExtraction.prototype.SameAsSource;

      sourceWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(sourceWindow.mainView);
      var targetWindow = ImageWindow.activeWindow;
      sourceWindow.mainView.endProcess();

      return targetWindow;
}

function newMaskWindow(sourceWindow, name, allow_duplicate_name)
{
      var targetWindow;

      if (sourceWindow.mainView.image.colorSpace != ColorSpace_Gray) {
            /* If we have color files we extract lightness component and
               use it as a mask.
            */
            addProcessingStep("Create mask by extracting lightness component from color image "+ sourceWindow.mainView.id);

            targetWindow = extractLchannel(sourceWindow);
            
            windowRenameKeepifEx(targetWindow.mainView.id, name, true, allow_duplicate_name);
      } else {
            /* Default mask is the same as stretched image. */
            addProcessingStep("Create mask from image " + sourceWindow.mainView.id);
            targetWindow = copyWindowEx(sourceWindow, name, allow_duplicate_name);
      }

      targetWindow.show();

      if (!par.skip_mask_contrast.val) {
            extraContrast(targetWindow);
      }

      return targetWindow;
}

function maskIsCompatible(imgWin, maskWin)
{
      if (maskWin == null) {
            return null;
      }
      try {
            imgWin.setMask(maskWin);
            imgWin.removeMask();
      } catch(err) {
            maskWin = null;
      }
      return maskWin;
}

function openImageFiles(filetype, lights_only, json_only)
{
      var ofd = new OpenFileDialog;

      ofd.multipleSelections = true;
      if (json_only) {
            ofd.caption = "Select " + filetype + " File";
      } else {
            ofd.caption = "Select " + filetype + " Images, or Json File";
      }
      var fits_files = "*.fit *.fits *.fts";
      var raw_files = "*.3fr *.ari *.arw *.bay *.braw *.crw *.cr2 *.cr3 *.cap *.data *.dcs *.dcr *.dng " +
                      "*.drf *.eip *.erf *.fff *.gpr *.iiq *.k25 *.kdc *.mdc *.mef *.mos *.mrw *.nef *.nrw *.obm *.orf " +
                      "*.pef *.ptx *.pxn *.r3d *.raf *.raw *.rwl *.rw2 *.rwz *.sr2 *.srf *.srw *.tif *.x3f *.xisf";
      var image_files = fits_files + " " + raw_files;

      if (json_only) {
            ofd.filters = [
                  ["Json files", "*.json"],
                  ["All files", "*.*"]
            ];
      } else if (!par.select_all_files.val) {
            ofd.filters = [
                  ["Image files", image_files],
                  ["Json files", "*.json"],
                  ["All files", "*.*"]
            ];
      } else {
            ofd.filters = [
                  ["All files", "*.*"],
                  ["Json files", "*.json"],
                  ["Image files", image_files]
            ];
      }
      if (!ofd.execute()) {
            return null;
      }

      if (ofd.fileNames.length < 1) {
            return null;
      }
      if (json_only) {
            // accept any single file selected
            if (ofd.fileNames.length != 1)  {
                  console.criticalln("Only one Json file can be loaded");
                  return null;
            }
            var is_json_file = true;
      } else {
            var is_json_file = (ofd.fileNames.length == 1 && File.extractExtension(ofd.fileNames[0]) == ".json");
      }
      if (is_json_file) {
            /* Read files from a json file.
             * If lights_only, return a simple file array of light files
             * If not lights_only, return treebox files for each page
             */
            var pagearray = parseJsonFile(ofd.fileNames[0], lights_only);
            if (lights_only) {
                  if (pagearray[pages.LIGHTS] == null) {
                        return null;
                  } else {
                        return treeboxfilesToFilenames(pagearray[pages.LIGHTS].files);
                  }
            } else {
                  return pagearray;
            }
      } else if (!lights_only) {
            /* Returns a simple file array as the only array member
             */
            return [ ofd.fileNames ];
      } else {
            // return a simple file array
            return ofd.fileNames;
      }
}

function findMin(arr, idx)
{
      var minval = arr[0][idx];
      for (var i = 1; i < arr.length; i++) {
            if (arr[i][idx] < minval) {
                  minval = arr[i][idx];
            }
      }
      return minval;
}

function findMax(arr, idx)
{
      var maxval = arr[0][idx];
      for (var i = 1; i < arr.length; i++) {
            if (arr[i][idx] > maxval) {
                  maxval = arr[i][idx];
            }
      }
      return maxval;
}

function updateBinningKeywords(imageWindow, binning_size)
{
      var newKeywords = [];
      var keywords = imageWindow.keywords;
      for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.name == 'NAXIS1' 
                || keyword.name == 'NAXIS2'
                || keyword.name == 'IMAGEW'
                || keyword.name == 'IMAGEH')
            {
                  var value = keyword.strippedValue.trim();
                  var naxis = parseInt(value);
                  var new_naxis = naxis / binning_size;
                  newKeywords[newKeywords.length] = new FITSKeyword(
                                                            keyword.name,
                                                            new_naxis.toFixed(0),
                                                            "");
            } else {
                  newKeywords[newKeywords.length] = keyword;
            }
      }
      imageWindow.keywords = newKeywords;
}

function filterKeywords(imageWindow, keywordname) 
{
      var oldKeywords = [];
      var keywords = imageWindow.keywords;
      for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.name != keywordname) {
                  oldKeywords[oldKeywords.length] = keyword;
            }
      }
      return oldKeywords;
}

function findKeywords(imageWindow, keywordname) 
{
      var keywords = imageWindow.keywords;
      for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.name == keywordname) {
                  return true;
            }
      }
      return false;
}

// Running PixelMath removes all keywords
// We make a copy of selected keywords that are
// put back to PixelMath generated image
function getTargetFITSKeywordsForPixelmath(imageWindow)
{
      var oldKeywords = [];
      var keywords = imageWindow.keywords;
      for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i];
            if (keyword.name != 'FILTER'
                && keyword.name != 'COMMENT'
                && keyword.name != 'HISTORY') 
            {
                  oldKeywords[oldKeywords.length] = keyword;
            }
      }
      return oldKeywords;
}

// put keywords to PixelMath generated image
function setTargetFITSKeywordsForPixelmath(imageWindow, keywords)
{
      imageWindow.keywords = keywords;
}

function setSSWEIGHTkeyword(imageWindow, SSWEIGHT) 
{
      var oldKeywords = filterKeywords(imageWindow, "SSWEIGHT");
      imageWindow.keywords = oldKeywords.concat([
         new FITSKeyword(
            "SSWEIGHT",
            SSWEIGHT.toFixed(3),
            "Image weight"
         )
      ]);
      ssweight_set = true;
}

function setFITSKeyword(imageWindow, name, value, comment) 
{
      var oldKeywords = filterKeywords(imageWindow, name);
      imageWindow.keywords = oldKeywords.concat([
         new FITSKeyword(
            name,
            value,
            comment
         )
      ]);
}

function setFITSKeywordNoOverwrite(imageWindow, name, value, comment) 
{
      if (findKeywords(imageWindow, name)) {
            console.writeln("keyword already set");
            return;
      }
      setFITSKeyword(imageWindow, name, value, comment);
}

function setFinalImageKeyword(imageWindow) 
{
      console.writeln("setFinalImageKeyword to " + imageWindow.mainView.id);
      setFITSKeyword(
            imageWindow,
            "AutoIntegrate",
            "finalimage",
            "AutoIntegrate processed final image");
}

function setProcessedImageKeyword(imageWindow) 
{
      console.writeln("setProcessedImageKeyword to " + imageWindow.mainView.id);
      setFITSKeywordNoOverwrite(
            imageWindow,
            "AutoIntegrate",
            "processedimage",
            "AutoIntegrate processed intermediate image");
}

function setImagetypKeyword(imageWindow, imagetype) 
{
      setFITSKeyword(
            imageWindow,
            "IMAGETYP",
            imagetype,
            "Type of image");
}

function setFilterKeyword(imageWindow, value) 
{
      setFITSKeyword(
            imageWindow,
            "FILTER",
            value,
            "Filter used when taking the image");
}

function writeImage(filePath, imageWindow) 
{
      var fileFormat = new FileFormat("XISF", false, true);
      if (fileFormat.isNull) {
            console.writeln("writeImage:FileFormat failed");
            return false;
      }
   
      var fileFormatInstance = new FileFormatInstance(fileFormat);
      if (fileFormatInstance.isNull) {
            console.writeln("writeImage:FileFormatInstance failed");
            return false;
      }
   
      if (!fileFormatInstance.create(filePath, "")) {
            console.writeln("writeImage:fileFormatInstance.create failed");
            return false;
      }
   
      fileFormatInstance.keywords = imageWindow.keywords;
      if (!fileFormatInstance.writeImage(imageWindow.mainView.image)) {
            console.writeln("writeImage:fileFormatInstance.writeImage failed");
            return false;
      }
   
      fileFormatInstance.close();
   
      return true;
}

/* 
 * Image calibration as described in Light Vortex Astronomy.
 */

// Integrate (stack) bias and dark images
function runImageIntegrationBiasDarks(images, name)
{
      console.writeln("runImageIntegrationBiasDarks, images[0] " + images[0][1] + ", name " + name);

      ensureThreeImages(images);

      var P = new ImageIntegration;
      P.images = images; // [ enabled, path, drizzlePath, localNormalizationDataPath ];
      P.rejection = getRejectionAlgorigthm(images.length);
      P.weightMode = ImageIntegration.prototype.DontCare;
      P.normalization = ImageIntegration.prototype.NoNormalization;
      P.rangeClipLow = false;
      P.evaluateNoise = false;

      P.executeGlobal();

      windowCloseif(P.highRejectionMapImageId);
      windowCloseif(P.lowRejectionMapImageId);
      windowCloseif(P.slopeMapImageId);

      var new_name = windowRename(P.integrationImageId, name);

      console.writeln("runImageIntegrationBiasDarks, integrated image " + new_name);

      return new_name;
}

// Generate SuperBias from integrated bias image
function runSuberBias(biasWin)
{
      console.writeln("runSuberBias, bias " + biasWin.mainView.id);

      var P = new Superbias;

      biasWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(biasWin.mainView, false);

      biasWin.mainView.endProcess();

      var targetWindow = ImageWindow.activeWindow;

      windowRenameKeepif(targetWindow.mainView.id, ppar.win_prefix + "AutoMasterSuperBias", true);

      return targetWindow.mainView.id
}

// Run ImageCalibration to darks using master bias image
// Output will be _c.xisf images
function runCalibrateDarks(images, masterbiasPath)
{
      if (masterbiasPath == null) {
            console.writeln("runCalibrateDarks, no master bias");
            return imagesEnabledPathToFileList(images);
      }

      console.writeln("runCalibrateDarks, images[0] " + images[0][1] + ", master bias " + masterbiasPath);

      var P = new ImageCalibration;
      P.targetFrames = filesNamesToEnabledPath(images); // [ enabled, path ];
      P.enableCFA = is_color_files && par.debayerPattern.val != 'None';
      P.cfaPattern = debayerPattern_enums[debayerPattern_values.indexOf(par.debayerPattern.val)];
      P.masterBiasEnabled = true;
      P.masterBiasPath = masterbiasPath;
      P.masterDarkEnabled = false;
      P.masterFlatEnabled = false;
      P.outputDirectory = outputRootDir + AutoOutputDir;
      P.overwriteExistingFiles = true;

      P.executeGlobal();

      return fileNamesFromOutputData(P.outputData);
}

// Run ImageCalibration to flats using master bias and master dark images
// Output will be _c.xisf images
function runCalibrateFlats(images, masterbiasPath, masterdarkPath, masterflatdarkPath)
{
      if (masterbiasPath == null && masterdarkPath == null && masterflatdarkPath == null) {
            console.writeln("runCalibrateFlats, no master bias or dark");
            return imagesEnabledPathToFileList(images);
      }

      console.writeln("runCalibrateFlats, images[0] " + images[0][1]);

      var P = new ImageCalibration;
      P.targetFrames = images; // [ // enabled, path ];
      P.enableCFA = is_color_files && par.debayerPattern.val != 'None';
      P.cfaPattern = debayerPattern_enums[debayerPattern_values.indexOf(par.debayerPattern.val)];
      if (masterflatdarkPath != null) {
            console.writeln("runCalibrateFlats, master flat dark " + masterflatdarkPath);
            P.masterBiasEnabled = true;
            P.masterBiasPath = masterflatdarkPath;
      } else if (masterbiasPath != null) {
            console.writeln("runCalibrateFlats, master bias " + masterbiasPath);
            P.masterBiasEnabled = true;
            P.masterBiasPath = masterbiasPath;
      } else {
            console.writeln("runCalibrateFlats, no master bias or flat dark");
            P.masterBiasEnabled = false;
            P.masterBiasPath = "";
      }
      if (masterdarkPath != null && !par.no_darks_on_flat_calibrate.val && masterflatdarkPath == null) {
            console.writeln("runCalibrateFlats, master dark " + masterdarkPath);
            P.masterDarkEnabled = true;
            P.masterDarkPath = masterdarkPath;
      } else {
            console.writeln("runCalibrateFlats, no master dark");
            P.masterDarkEnabled = false;
            P.masterDarkPath = "";
      }
      P.masterFlatEnabled = false;
      P.masterFlatPath = "";
      P.calibrateBias = false;
      if (par.pre_calibrate_darks.val) {
            P.calibrateDark = false;
      } else {
            P.calibrateDark = true;
      }
      P.outputDirectory = outputRootDir + AutoOutputDir;
      P.overwriteExistingFiles = true;

      P.executeGlobal();

      return fileNamesFromOutputData(P.outputData);
}

// Run image integration on flat frames
// If you have stars in flat frames, set
// P.pcClipLow and P.pcClipHigh to a 
// tiny value like 0.010
function runImageIntegrationFlats(images, name)
{
      console.writeln("runImageIntegrationFlats, images[0] " + images[0][1] + ", name " + name);


      var P = new ImageIntegration;
      P.images = images; // [ enabled, path, drizzlePath, localNormalizationDataPath ];
      P.weightMode = ImageIntegration.prototype.DontCare;
      P.normalization = ImageIntegration.prototype.MultiplicativeWithScaling;
      P.rejection = ImageIntegration.prototype.PercentileClip;
      P.rejectionNormalization = ImageIntegration.prototype.EqualizeFluxes;
      if (par.stars_in_flats.val) {
            P.pcClipLow = 0.010;
            P.pcClipHigh = 0.010;
      } else {
            P.pcClipLow = 0.200;
            P.pcClipHigh = 0.100;
      }
      P.rangeClipLow = false;

      P.executeGlobal();

      windowCloseif(P.highRejectionMapImageId);
      windowCloseif(P.lowRejectionMapImageId);
      windowCloseif(P.slopeMapImageId);

      var new_name = windowRename(P.integrationImageId, name);

      console.writeln("runImageIntegrationFlats, integrated image " + new_name);

      return new_name;
}

function runCalibrateLights(images, masterbiasPath, masterdarkPath, masterflatPath)
{
      if (masterbiasPath == null && masterdarkPath == null && masterflatPath == null) {
            console.writeln("runCalibrateLights, no master bias, dark or flat");
            return imagesEnabledPathToFileList(images);
      }

      console.writeln("runCalibrateLights, images[0] " + images[0][1]);

      var P = new ImageCalibration;
      P.targetFrames = images; // [ enabled, path ];
      P.enableCFA = is_color_files && par.debayerPattern.val != 'None';
      P.cfaPattern = debayerPattern_enums[debayerPattern_values.indexOf(par.debayerPattern.val)];
      if (masterbiasPath != null) {
            console.writeln("runCalibrateLights, master bias " + masterbiasPath);
            P.masterBiasEnabled = true;
            P.masterBiasPath = masterbiasPath;
      } else {
            console.writeln("runCalibrateLights, no master bias");
            P.masterBiasEnabled = false;
            P.masterBiasPath = "";
      }
      if (masterdarkPath != null) {
            console.writeln("runCalibrateLights, master dark " + masterdarkPath);
            P.masterDarkEnabled = true;
            P.masterDarkPath = masterdarkPath;
      } else {
            console.writeln("runCalibrateLights, no master dark");
            P.masterDarkEnabled = false;
            P.masterDarkPath = "";
      }
      if (masterflatPath != null) {
            console.writeln("runCalibrateLights, master flat " + masterflatPath);
            P.masterFlatEnabled = true;
            P.masterFlatPath = masterflatPath;
      } else {
            console.writeln("runCalibrateLights, no master flat");
            P.masterFlatEnabled = false;
            P.masterFlatPath = "";
      }
      if (par.optimize_darks.val) {
            P.calibrateBias = false;
            if (par.pre_calibrate_darks.val) {
                  P.calibrateDark = false;
            } else {
                  P.calibrateDark = true;
            }
            P.calibrateFlat = false;
            P.optimizeDarks = true;

      } else {
            P.masterBiasEnabled = false;
            P.masterBiasPath = "";

            P.calibrateBias = false;
            P.calibrateDark = false;
            P.calibrateFlat = false;
            P.optimizeDarks = false;
      }
      P.outputDirectory = outputRootDir + AutoCalibratedDir;
      P.overwriteExistingFiles = true;

      P.executeGlobal();

      return fileNamesFromOutputData(P.outputData);
}

function filesForImageIntegration(fileNames)
{
      var images = [];
      for (var i = 0; i < fileNames.length; i++) {
            images[images.length] = [ true, fileNames[i] ]; // [ enabled, path, drizzlePath, localNormalizationDataPath ];
      }
      return images;
}

function filesNamesToEnabledPath(fileNames)
{
      var images = [];
      for (var i = 0; i < fileNames.length; i++) {
            images[images.length] = [ true, fileNames[i] ]; // [ enabled, path ];
      }
      return images;
}

function filesNamesToEnabledPathFromFilearr(filearr)
{
      var images = [];
      for (var i = 0; i < filearr.length; i++) {
            images[images.length] = [ true, filearr[i].name ]; // [ enabled, path ];
      }
      return images;
}

function imagesEnabledPathToFileList(images)
{
      var fileNames = [];
      for (var i = 0; i < images.length; i++) {
            fileNames[fileNames.length] = images[i][1];
      }
      return fileNames;
}


// Calibration engine to run image calibration 
// if bias, dark and/or flat files are selected.
function calibrateEngine(filtered_lights)
{
      if (biasFileNames == null) {
            biasFileNames = [];
      }
      if (flatdarkFileNames == null) {
            flatdarkFileNames = [];
      }
      if (flatFileNames == null) {
            flatFileNames = [];
      }
      if (darkFileNames == null) {
            darkFileNames = [];
      }
      if (biasFileNames.length == 0
          && flatdarkFileNames.length == 0
          && flatFileNames.length == 0
          && darkFileNames.length == 0)
      {
            // do not calibrate
            addProcessingStep("calibrateEngine, no bias, flat or dark files");
            return [ lightFileNames , '' ];
      }

      addProcessingStep("calibrateEngine");

      ensureDir(outputRootDir);
      ensureDir(combinePath(outputRootDir, AutoMasterDir));
      ensureDir(combinePath(outputRootDir, AutoOutputDir));
      ensureDir(combinePath(outputRootDir, AutoCalibratedDir));

      // Collect filter files
      var filtered_flats = getFilterFiles(flatFileNames, pages.FLATS, '');

      is_color_files = filtered_flats.color_files;

      if (flatFileNames.length > 0 && lightFileNames.length > 0) {
            // we have flats and lights
            // check that filtered files match
            for (var i = 0; i < filtered_flats.allfilesarr.length; i++) {
                  var is_flats = filtered_flats.allfilesarr[i].files.length > 0;
                  var is_lights = filtered_lights.allfilesarr[i].files.length > 0;
                  if (is_flats != is_lights) {
                        // lights and flats do not match on filters
                        throwFatalError("Filters on light and flat images do not match.");
                  }
            }
      }

      if (biasFileNames.length == 1) {
            addProcessingStep("calibrateEngine use existing master bias " + biasFileNames[0]);
            var masterbiasPath = biasFileNames[0];
      } else if (biasFileNames.length > 0) {
            addProcessingStep("calibrateEngine generate master bias using " + biasFileNames.length + " files");
            // integrate bias images
            var biasimages = filesForImageIntegration(biasFileNames);
            var masterbiasid = runImageIntegrationBiasDarks(biasimages, ppar.win_prefix + "AutoMasterBias");

            // save master bias
            setImagetypKeyword(findWindow(masterbiasid), "Master bias");
            var masterbiasPath = saveMasterWindow(outputRootDir, masterbiasid);

            // optionally generate superbias
            if (par.create_superbias.val) {
                  var masterbiaswin = findWindow(masterbiasid);
                  var mastersuperbiasid = runSuberBias(masterbiaswin);
                  setImagetypKeyword(findWindow(mastersuperbiasid), "Master bias");
                  var masterbiasPath = saveMasterWindow(outputRootDir, mastersuperbiasid);
            }
      } else {
            addProcessingStep("calibrateEngine no master bias");
            var masterbiasPath = null;
      }

      if (flatdarkFileNames.length == 1) {
            addProcessingStep("calibrateEngine use existing master flat dark " + flatdarkFileNames[0]);
            var masterflatdarkPath = flatdarkFileNames[0];
      } else if (flatdarkFileNames.length > 0) {
            addProcessingStep("calibrateEngine generate master flat dark using " + flatdarkFileNames.length + " files");
            // integrate flat dark images
            var flatdarkimages = filesForImageIntegration(flatdarkFileNames);
            var masterflatdarkid = runImageIntegrationBiasDarks(flatdarkimages, ppar.win_prefix + "AutoMasterFlatDark");
            setImagetypKeyword(findWindow(masterflatdarkid), "Master flat dark");
            var masterflatdarkPath = saveMasterWindow(outputRootDir, masterflatdarkid);
      } else {
            addProcessingStep("calibrateEngine no master flat dark");
            var masterflatdarkPath = null;
      }

      if (darkFileNames.length == 1) {
            addProcessingStep("calibrateEngine use existing master dark " + darkFileNames[0]);
            var masterdarkPath = darkFileNames[0];
      } else if (darkFileNames.length > 0) {
            addProcessingStep("calibrateEngine generate master dark using " + darkFileNames.length + " files");
            if (par.pre_calibrate_darks.val && masterbiasPath != null) {
                  // calibrate dark frames with bias
                  var darkcalFileNames = runCalibrateDarks(darkFileNames, masterbiasPath);
                  var darkimages = filesForImageIntegration(darkcalFileNames);
            } else {
                  var darkimages = filesForImageIntegration(darkFileNames);
            }
            // generate master dark file
            var masterdarkid = runImageIntegrationBiasDarks(darkimages, ppar.win_prefix + "AutoMasterDark");
            setImagetypKeyword(findWindow(masterdarkid), "Master dark");
            var masterdarkPath = saveMasterWindow(outputRootDir, masterdarkid);
      } else {
            addProcessingStep("calibrateEngine no master dark");
            var masterdarkPath = null;
      }

      // generate master flat for each filter
      addProcessingStep("calibrateEngine generate master flats");
      var masterflatPath = [];
      for (var i = 0; i < filtered_flats.allfilesarr.length; i++) {
            var filterFiles = filtered_flats.allfilesarr[i].files;
            var filterName = filtered_flats.allfilesarr[i].filter;
            if (filterFiles.length == 1) {
                  addProcessingStep("calibrateEngine use existing " + filterName + " master flat " + filterFiles[0].name);
                  masterflatPath[i] = filterFiles[0].name;
            } else if (filterFiles.length > 0) {
                  // calibrate flats for each filter with master bias and master dark
                  addProcessingStep("calibrateEngine calibrate " + filterName + " flats using " + filterFiles.length + " files, " + filterFiles[0].name);
                  var flatcalimages = filesNamesToEnabledPathFromFilearr(filterFiles);
                  console.writeln("flatcalimages[0] " + flatcalimages[0][1]);
                  var flatcalFileNames = runCalibrateFlats(flatcalimages, masterbiasPath, masterdarkPath, masterflatdarkPath);
                  console.writeln("flatcalFileNames[0] " + flatcalFileNames[0]);

                  // integrate flats to generate master flat for each filter
                  var flatimages = filesForImageIntegration(flatcalFileNames);
                  console.writeln("flatimages[0] " + flatimages[0][1]);
                  masterflatid = runImageIntegrationFlats(flatimages, ppar.win_prefix + "AutoMasterFlat_" + filterName);
                  console.writeln("masterflatid " + masterflatid);
                  setImagetypKeyword(findWindow(masterflatid), "Master flat");
                  setFilterKeyword(findWindow(masterflatid), filterFiles[0].filter);
                  masterflatPath[i] = saveMasterWindow(outputRootDir, masterflatid);
            } else {
                  masterflatPath[i] = null;
            }
      }

      addProcessingStep("calibrateEngine calibrate light images");
      var calibratedLightFileNames = [];
      for (var i = 0; i < filtered_lights.allfilesarr.length; i++) {
            var filterFiles = filtered_lights.allfilesarr[i].files;
            var filterName = filtered_lights.allfilesarr[i].filter;
            if (filterFiles.length > 0) {
                  // calibrate light frames with master bias, master dark and master flat
                  // optionally master dark can be left out
                  addProcessingStep("calibrateEngine calibrate " + filterName + " lights using " + filterFiles.length + " files, " + filterFiles[0].name);
                  var lightcalimages = filesNamesToEnabledPathFromFilearr(filterFiles);
                  var lightcalFileNames = runCalibrateLights(lightcalimages, masterbiasPath, masterdarkPath, masterflatPath[i]);
                  calibratedLightFileNames = calibratedLightFileNames.concat(lightcalFileNames);
            }
      }

      // We now have calibrated light images
      // We now proceed with cosmetic correction and
      // after that debayering in case of OSC/RAW files

      console.writeln("calibrateEngine, return calibrated images, calibratedLightFileNames[0] " + calibratedLightFileNames[0]);

      return [ calibratedLightFileNames, '_c' ];
}

/* Linear Defect Detection from LinearDefectDetection.js script.

   Copyright (c) 2019 Vicent Peris (OAUV). All Rights Reserved.
*/
function LDDEngine( win, detectColumns, detectPartialLines,
                                layersToRemove, rejectionLimit, imageShift,
                                detectionThreshold, partialLineDetectionThreshold )
{
   console.writeln("LDDEngine");
   let WI = new DefineWindowsAndImages( win, detectPartialLines );

   // Generate the small-scale image by subtracting
   // the large-scale components of the image.
   MultiscaleIsolation( WI.referenceSSImage, null, layersToRemove );

   // Build a list of lines in the image.
   // This can include entire or partial rows or columns.
   if ( layersToRemove < 7 )
      layersToRemove = 7;
   let partialLines;
   if ( detectPartialLines )
      partialLines = new PartialLineDetection( detectColumns, WI.referenceImageCopy,
                                               layersToRemove - 3, imageShift,
                                               partialLineDetectionThreshold );

   let maxPixelPara, maxPixelPerp;
   if ( detectColumns )
   {
      maxPixelPara = WI.referenceImage.height - 1;
      maxPixelPerp = WI.referenceImage.width - 1;
   }
   else
   {
      maxPixelPara = WI.referenceImage.width - 1;
      maxPixelPerp = WI.referenceImage.height - 1;
   }

   let lines;
   if ( detectPartialLines )
      lines = new LineList( true,
                            partialLines.columnOrRow,
                            partialLines.startPixel,
                            partialLines.endPixel,
                            maxPixelPara, maxPixelPerp );
   else
      lines = new LineList( true, [], [], [], maxPixelPara, maxPixelPerp );

   // Calculate the median value of each line in the image.
   // Create a model image with the lines filled
   // by their respective median values.
   console.writeln( "<end><cbr><br>Analyzing " + lines.columnOrRow.length + " lines in the image<br>" );
   let lineValues = new Array;
   for ( let i = 0; i < lines.columnOrRow.length; ++i )
   {
      let lineRect;
      if ( detectColumns )
      {
         lineRect = new Rect( 1, lines.endPixel[i] - lines.startPixel[i] + 1 );
         lineRect.moveTo( lines.columnOrRow[i], lines.startPixel[i] );
      }
      else
      {
         lineRect = new Rect( lines.endPixel[i] - lines.startPixel[i] + 1, 1 );
         lineRect.moveTo( lines.startPixel[i], lines.columnOrRow[i] );
      }

      let lineStatistics = new IterativeStatistics( WI.referenceSSImage, lineRect, rejectionLimit );
      WI.lineModelImage.selectedRect = lineRect;
      WI.lineModelImage.apply( lineStatistics.median );
      lineValues.push( lineStatistics.median );
   }
   WI.referenceSSImage.resetSelections();
   WI.lineModelImage.resetSelections();

   // Build the detection map image
   // and the list of detected line defects.
   this.detectedColumnOrRow = new Array;
   this.detectedStartPixel = new Array;
   this.detectedEndPixel = new Array;
   let lineModelMedian = WI.lineModelImage.median();
   let lineModelMAD = WI.lineModelImage.MAD();
   let lineRect;
   for ( let i = 0; i < lineValues.length; ++i )
   {
      if ( detectColumns )
      {
         lineRect = new Rect( 1, lines.endPixel[i] - lines.startPixel[i] + 1 );
         lineRect.moveTo( lines.columnOrRow[i], lines.startPixel[i] );
      }
      else
      {
         lineRect = new Rect( lines.endPixel[i] - lines.startPixel[i] + 1, 1 );
         lineRect.moveTo( lines.startPixel[i], lines.columnOrRow[i] );
      }

      WI.lineDetectionImage.selectedRect = lineRect;
      let sigma = Math.abs( lineValues[i] - lineModelMedian ) / ( lineModelMAD * 1.4826 );
      WI.lineDetectionImage.apply( parseInt( sigma ) / ( detectionThreshold + 1 ) );
      if ( sigma >= detectionThreshold )
      {
         this.detectedColumnOrRow.push( lines.columnOrRow[i] );
         this.detectedStartPixel.push( lines.startPixel[i] );
         this.detectedEndPixel.push( lines.endPixel[i] );
      }
   }

   // Transfer the resulting images to their respective windows.
   WI.lineDetectionImage.resetSelections();
   WI.lineDetectionImage.truncate( 0, 1 );
   WI.lineModelImage.apply( WI.referenceImage.median(), ImageOp_Add );

   WI.lineModelWindow.mainView.beginProcess();
   WI.lineModelWindow.mainView.image.apply( WI.lineModelImage );
   WI.lineModelWindow.mainView.endProcess();

   WI.lineDetectionWindow.mainView.beginProcess();
   WI.lineDetectionWindow.mainView.image.apply( WI.lineDetectionImage );
   WI.lineDetectionWindow.mainView.endProcess();

   // Free memory space taken by working images.
   WI.referenceImage.free();
   WI.referenceSSImage.free();
   WI.lineModelImage.free();
   WI.lineDetectionImage.free();
   if ( detectPartialLines )
      WI.referenceImageCopy.free();
   closeOneWindow(WI.lineModelWindow.mainView.id);
   closeOneWindow(WI.lineDetectionWindow.mainView.id);
   closeOneWindow("partial_line_detection");
}

// ----------------------------------------------------------------------------

/*
 * Function to subtract the large-scale components from an image using the
 * median wavelet transform.
 */
function MultiscaleIsolation( image, LSImage, layersToRemove )
{
   // Generate the large-scale components image.
   // First we generate the array that defines
   // the states (enabled / disabled) of the scale layers.
   let scales = new Array;
   for ( let i = 0; i < layersToRemove; ++i )
      scales.push( 1 );

   // The scale layers are an array of images.
   // We use the medianWaveletTransform. This algorithm is less prone
   // to show vertical patterns in the large-scale components.
   let multiscaleTransform = new Array;
   multiscaleTransform = image.medianWaveletTransform( layersToRemove-1, 0, scales );
   // We subtract the last layer to the image.
   // Please note that this image has negative pixel values.
   image.apply( multiscaleTransform[layersToRemove-1], ImageOp_Sub );
   // Generate a large-scale component image
   // if the respective input image is not null.
   if ( LSImage != null )
      LSImage.apply( multiscaleTransform[layersToRemove-1] );
   // Remove the multiscale layers from memory.
   for ( let i = 0; i < multiscaleTransform.length; ++i )
      multiscaleTransform[i].free();
}

/*
 * Function to create a list of vertical or horizontal lines in an image. It
 * can combine entire rows or columns and fragmented ones, if an array of
 * partial sections is specified in the input par. This list is used to
 * input the selected regions in the IterativeStatistics function.
 */
function LineList( correctEntireImage, partialColumnOrRow, partialStartPixel, partialEndPixel, maxPixelPara, maxPixelPerp )
{
   this.columnOrRow = new Array;
   this.startPixel = new Array;
   this.endPixel = new Array;

   if ( !correctEntireImage )
   {
      this.columnOrRow = partialColumnOrRow;
      this.startPixel = partialStartPixel;
      this.endPixel = partialEndPixel;
   }
   else
   {
      if ( partialColumnOrRow.length == 0 )
         partialColumnOrRow.push( maxPixelPerp + 1 );

      let iPartial = 0;
      for ( let i = 0; i <= maxPixelPerp; ++i )
      {
         if ( iPartial < partialColumnOrRow.length )
         {
            if ( i < partialColumnOrRow[iPartial] && correctEntireImage )
            {
               this.columnOrRow.push( i );
               this.startPixel.push( 0 );
               this.endPixel.push( maxPixelPara );
            }
            else
            {
               // Get the partial column or row.
               this.columnOrRow.push( partialColumnOrRow[iPartial] );
               this.startPixel.push( partialStartPixel[iPartial] );
               this.endPixel.push( partialEndPixel[iPartial] );
               if ( partialStartPixel[iPartial] > 0 )
               {
                  this.columnOrRow.push( partialColumnOrRow[iPartial] );
                  this.startPixel.push( 0 );
                  this.endPixel.push( partialStartPixel[iPartial] - 1 );
               }
               if ( partialEndPixel[iPartial] < maxPixelPara )
               {
                  this.columnOrRow.push( partialColumnOrRow[iPartial] );
                  this.startPixel.push( partialEndPixel[iPartial] + 1 );
                  this.endPixel.push( maxPixelPara );
               }
               // In some cases, there can be more than one section of
               // the same column or row in the partial defect list.
               // In that case, i (which is the current column or row number)
               // shouldn't increase because we are repeating
               // the same column or row.
               i = partialColumnOrRow[iPartial];
               ++iPartial;
            }
         }
         else if ( correctEntireImage )
         {
            this.columnOrRow.push( i );
            this.startPixel.push( 0 );
            this.endPixel.push( maxPixelPara );
         }
      }
   }
}

/*
 * Function to calculate the median and MAD of a selected image area with
 * iterative outlier rejection in the high end of the distribution. Useful to
 * reject bright objects in a background-dominated image, especially if the
 * input image is the output image of MultiscaleIsolation.
 */
function IterativeStatistics( image, rectangle, rejectionLimit )
{
   image.selectedRect = rectangle;
   let formerHighRejectionLimit = 1000;
   // The initial currentHighRejectionLimit value is set to 0.99 because
   // the global rejection sets the rejected pixels to 1. This way, those
   // pixels are already rejected in the first iteration.
   let currentHighRejectionLimit = 0.99;
   let j = 0;
   while ( formerHighRejectionLimit / currentHighRejectionLimit > 1.001 || j < 10 )
   {
      // Construct the statistics object to rectangle statistics.
      // These statistics are updated with the new high rejection limit
      // calculated at the end of the iteration.
      let iterativeRectangleStatistics = new ImageStatistics;
      with ( iterativeRectangleStatistics )
      {
         medianEnabled = true;
         lowRejectionEnabled = false;
         highRejectionEnabled = true;
         rejectionHigh = currentHighRejectionLimit;
      }
      iterativeRectangleStatistics.generate( image );
      this.median = iterativeRectangleStatistics.median;
      this.MAD = iterativeRectangleStatistics.mad;
      formerHighRejectionLimit = currentHighRejectionLimit;
      currentHighRejectionLimit = parseFloat( this.median + ( iterativeRectangleStatistics.mad * 1.4826 * rejectionLimit ) );
      ++j;
   }
   image.resetSelections();
}

/*
 * Function to detect defective partial columns or rows in an image.
 */
function PartialLineDetection( detectColumns, image, layersToRemove, imageShift, threshold )
{
   if ( ( detectColumns ? image.height : image.width ) < imageShift * 4 )
      throw new Error( "imageShift parameter too high for the current image size" );


   // Create a small-scale component image and its image window.
   // SSImage will be the main view of the small-scale component
   // image window because we need to apply a
   // MorphologicalTransformation instance to it.
   this.SSImageWindow = new ImageWindow( image.width,
                                         image.height,
                                         image.numberOfChannels,
                                         32, true, false,
                                         "partial_line_detection" );

   // The initial small-scale component image is the input image.
   this.SSImage = new Image( image.width,
                             image.height,
                             image.numberOfChannels,
                             image.colorSpace,
                             image.bitsPerSample,
                             SampleType_Real );

   this.SSImage.apply( image );

   // Subtract the large-scale components to the image.
   console.noteln( "<end><cbr><br>* Isolating small-scale image components..." );
   console.flush();
   MultiscaleIsolation( this.SSImage, null, layersToRemove );

   // The clipping mask is an image to reject the highlights
   // of the processed small-scale component image. The initial
   // state of this image is the small-scale component image
   // after removing the large-scale components. We simply
   // binarize this image at 5 sigmas above the image median.
   // This way, the bright structures are white and the rest
   // of the image is pure black. We'll use this image
   // at the end of the processing.
   let clippingMask = new Image( image.width,
                                 image.height,
                                 image.numberOfChannels,
                                 image.colorSpace,
                                 image.bitsPerSample,
                                 SampleType_Real );

   clippingMask.apply( this.SSImage );
   clippingMask.binarize( clippingMask.MAD() * 5 );

   // Apply a morphological transformation process
   // to the small-scale component image.
   // The structuring element is a line in the direction
   // of the lines to be detected.
   console.noteln( "<end><cbr><br>* Processing small-scale component image..." );
   console.flush();
   let structure;
   if ( detectColumns )
      structure =
      [[
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0
      ]];
   else
      structure =
      [[
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
         0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
      ]];

   console.writeln( "<end><cbr>Applying morphological median transformation..." );
   console.flush();
   for ( let i = 0; i < 5; ++i )
      this.SSImage.morphologicalTransformation( 4, structure, 0, 0, 1 );

   // Shift a clone of the small-scale component image
   // after the morphological transformation. We then subtract
   // the shifted image from its parent image. In the resulting
   // image, those linear structures with a sudden change
   // of contrast over the column or row will result in a bright
   // line at the origin of the defect. This lets us
   // to detect the defective partial columns or rows.
   let shiftedSSImage = new Image( image.width,
                                   image.height,
                                   image.numberOfChannels,
                                   image.colorSpace,
                                   32, SampleType_Real );

   shiftedSSImage.apply( this.SSImage );
   detectColumns ? shiftedSSImage.shiftBy( 0, -imageShift )
                 : shiftedSSImage.shiftBy( imageShift, 0 );
   this.SSImage.apply( shiftedSSImage, ImageOp_Sub );
   shiftedSSImage.free();

   // Subtract again the large-scale components
   // of this processed small-scale component image.
   // This will give a cleaner result before binarizing.
   console.writeln( "<end><cbr>Isolating small-scale image components..." );
   console.flush();
   MultiscaleIsolation( this.SSImage, null, layersToRemove - 3 );

   // Binarize the image to isolate the partial line detection structures.
   console.writeln( "<end><cbr>Isolating partial line defects..." );
   console.flush();
   let imageMedian = this.SSImage.median();
   let imageMAD = this.SSImage.MAD();
   this.SSImage.binarize( imageMedian + imageMAD*threshold );
   // Now, we subtract the binarized the clipping mask from this processed
   // small-scale component image. This removes the surviving linear structures
   // coming from bright objects in the image.
   this.SSImage.apply( clippingMask, ImageOp_Sub );
   this.SSImage.truncate( 0, 1 );

   // We apply a closure operation with the same structuring element.
   // This process removes short surviving lines coming from
   // the image noise while keeping the long ones
   console.writeln( "<end><cbr>Applying morphological closure transformation..." );
   console.flush();
   this.SSImage.morphologicalTransformation( 2, structure, 0, 0, 1 );

   // Detect the defective partial rows or columns. We select
   // those columns or rows having a minimum number of white pixels.
   // The minimum is half of the image shift and it is calculated
   // by comparing the mean pixel value to the length of the line.
   // Then, we find the maximum position to set the origin of the defect.
   // The maximum position is the start of the white line but the origin
   // of the defect is the end of the white line. To solve this,
   // we first mirror the image.
   console.noteln( "<end><cbr><br>* Detecting partial line defects..." );
   console.flush();
   let maxPixelPerp, maxPixelPara, lineRect;
   if ( detectColumns )
   {
      this.SSImage.mirrorVertical();
      maxPixelPerp = this.SSImage.width - 1;
      maxPixelPara = this.SSImage.height - 1;
      lineRect = new Rect( 1, this.SSImage.height );
   }
   else
   {
      this.SSImage.mirrorHorizontal();
      maxPixelPerp = this.SSImage.height - 1;
      maxPixelPara = this.SSImage.width - 1;
      lineRect = new Rect( this.SSImage.width, 1 );
   }

   this.columnOrRow = new Array;
   this.startPixel = new Array;
   this.endPixel = new Array;
   for ( let i = 0; i <= maxPixelPerp; ++i )
   {
      detectColumns ? lineRect.moveTo( i, 0 )
                    : lineRect.moveTo( 0, i );

      var lineMeanPixelValue = this.SSImage.mean( lineRect );
      // The equation at right sets the minimum length of the line
      // to trigger a defect detection.
      if ( lineMeanPixelValue > ( imageShift / ( ( maxPixelPara + 1 - imageShift * 2 ) * 2 ) ) )
      {
         this.columnOrRow.push( i )
         detectColumns  ? this.startPixel.push( maxPixelPara - parseInt( this.SSImage.maximumPosition( lineRect ).toArray()[1] ) )
                        : this.startPixel.push( maxPixelPara - parseInt( this.SSImage.maximumPosition( lineRect ).toArray()[0] ) );
         this.endPixel.push( maxPixelPara );
      }
   }

   detectColumns ? this.SSImage.mirrorVertical() : this.SSImage.mirrorHorizontal();

   this.SSImageWindow.mainView.beginProcess();
   this.SSImageWindow.mainView.image.apply( this.SSImage );
   this.SSImageWindow.mainView.endProcess();
   this.SSImageWindow.show();
}

/*
 * These are the image windows and images that will be used by the script
 * engine.
 */
function DefineWindowsAndImages( win, detectPartialLines )
{
   // Define the working image windows and images.
   this.referenceImageWindow = win;

   this.referenceImage = new Image( this.referenceImageWindow.mainView.image.width,
                                    this.referenceImageWindow.mainView.image.height,
                                    this.referenceImageWindow.mainView.image.numberOfChannels,
                                    this.referenceImageWindow.mainView.image.colorSpace,
                                    32, SampleType_Real );

   this.referenceImage.apply( this.referenceImageWindow.mainView.image );

   if ( detectPartialLines )
   {
      this.referenceImageCopy = new Image( this.referenceImageWindow.mainView.image.width,
                                           this.referenceImageWindow.mainView.image.height,
                                           this.referenceImageWindow.mainView.image.numberOfChannels,
                                           this.referenceImageWindow.mainView.image.colorSpace,
                                           32, SampleType_Real );

      this.referenceImageCopy.apply( this.referenceImageWindow.mainView.image );
   }

   this.referenceSSImage = new Image( this.referenceImage.width,
                                      this.referenceImage.height,
                                      this.referenceImage.numberOfChannels,
                                      this.referenceImage.colorSpace,
                                      32, SampleType_Real );

   this.referenceSSImage.apply( this.referenceImage );

   this.lineModelWindow = new ImageWindow( this.referenceImage.width,
                                           this.referenceImage.height,
                                           this.referenceImage.numberOfChannels,
                                           32, true, false, "line_model" );

   this.lineModelImage = new Image( this.referenceImage.width,
                                    this.referenceImage.height,
                                    this.referenceImage.numberOfChannels,
                                    this.referenceImage.colorSpace,
                                    32, SampleType_Real );

   this.lineDetectionWindow = new ImageWindow( this.referenceImage.width,
                                               this.referenceImage.height,
                                               this.referenceImage.numberOfChannels,
                                               32, true, false, "line_detection" );

   this.lineDetectionImage = new Image( this.referenceImage.width,
                                        this.referenceImage.height,
                                        this.referenceImage.numberOfChannels,
                                        this.referenceImage.colorSpace,
                                        32, SampleType_Real );
}

/*
 * LDDOutput the list of detected lines to console and text file.
 */
function LDDOutput( detectColumns, detectedLines, threshold, outputDir )
{
   console.writeln( "LDDOutput" );
   var defects = [];
   if ( detectedLines.detectedColumnOrRow.length > 0 )
   {
      console.noteln( "Detected lines" );
      console.noteln(  "--------------" );
      for ( let i = 0; i < detectedLines.detectedColumnOrRow.length; ++i )
      {
         var oneDefect = 
            [ 
                  true,                                     // defectEnabled
                  !detectColumns,                           // defectIsRow
                  detectedLines.detectedColumnOrRow[i],     // defectAddress
                  true,                                     // defectIsRange
                  detectedLines.detectedStartPixel[i],      // defectBegin
                  detectedLines.detectedEndPixel[i]         // defectEnd
            ];
         if (i == 0) {
            console.noteln(  oneDefect );
         }
         defects[defects.length] = oneDefect;
         console.noteln( "detectColumns=" + detectColumns + " " +
                         detectedLines.detectedColumnOrRow[i] + " " +
                         detectedLines.detectedStartPixel[i] + " " +
                         detectedLines.detectedEndPixel[i] );
      }
      console.noteln( "Detected defect lines: " + detectedLines.detectedColumnOrRow.length );
   }
   else
   {
      console.warningln( "No defect was detected. Try lowering the threshold value." );
   }
   return defects;
}

// Group files based on telescope and resolution
function getLDDgroups(fileNames)
{
      console.writeln("getLDDgroups");
      var groups = [];
      for (var i = 0; i < fileNames.length; i++) {
            var keywords = getFileKeywords(fileNames[i]);
            var groupname = "";
            var naxis1 = 0;
            for (var j = 0; j < keywords.length; j++) {
                  var value = keywords[j].strippedValue.trim();
                  switch (keywords[j].name) {
                        case "TELESCOP":
                              console.writeln("telescop=" + value);
                              groupname = groupname + value;
                              break;
                        case "NAXIS1":
                              console.writeln("naxis1=" + value);
                              groupname = groupname + value;
                              naxis1 = parseInt(value);
                              break;
                        default:
                              break;
                  }
            }
            for (var j = 0; j < groups.length; j++) {
                  if (groups[j].name == groupname) {
                        // found, add to existing group
                        groups[j].groupfiles[groups[j].groupfiles.length] = fileNames[i];
                        break;
                  }
            }
            if (j == groups.length) {
                  // not found, add a new group
                  console.writeln("getLDDgroups, add a new group " + groupname);
                  groups[groups.length] = { name: groupname, groupfiles: [ fileNames[i] ]};
            }
      }
      console.writeln("getLDDgroups found " + groups.length + " groups");
      return groups;
}

// Get row or col defect information
function getDefects(LDD_win, detectColumns)
{
      if (detectColumns) {
            console.writeln("getDefects, column defects");
      } else {
            console.writeln("getDefects, row defects");
      }

      var detectPartialLines = true;
      var layersToRemove = 9;
      var rejectionLimit = 3;
      var detectionThreshold = 5;
      var partialLineDetectionThreshold = 5;
      var imageShift = 50;

      // detect line defects
      var detectedLines = new LDDEngine( LDD_win, detectColumns, detectPartialLines,
                                         layersToRemove, rejectionLimit, imageShift,
                                         detectionThreshold, partialLineDetectionThreshold );
      // Generate output for cosmetic correction
      console.writeln("getDefects, LDDOutput");
      var defects = LDDOutput( detectColumns, detectedLines, detectionThreshold );

      return defects;
}

// Run ImageIntegration and then get row/col defects
function getDefectInfo(fileNames)
{
      console.writeln("getDefectInfo, fileNames[0]=" + fileNames[0]);
      var LDD_images = init_images();
      for (var i = 0; i < fileNames.length; i++) {
            append_image_for_integrate(LDD_images.images, fileNames[i]);
      }
      // Run image integration as-is to make line defects more visible
      console.writeln("getDefectInfo, runImageIntegration");
      var LDD_id = runImageIntegration(LDD_images, "LDD");
      var LDD_win = findWindow(LDD_id);
      var defects = [];

      if (par.fix_column_defects.val) {
            console.writeln("getDefectInfo, par.fix_column_defects.val");
            var colDefects = getDefects(LDD_win, true);
            defects = defects.concat(colDefects);
      }
      if (par.fix_row_defects.val) {
            console.writeln("getDefectInfo, par.fix_row_defects.val");
            var rowDefects = getDefects(LDD_win, false);
            defects = defects.concat(rowDefects);
      }

      closeOneWindow(LDD_id);

      return { ccFileNames: fileNames, ccDefects: defects };
}

function runLinearDefectDetection(fileNames)
{
      addProcessingStep("run Linear Defect Detection");
      console.writeln("runLinearDefectDetection, fileNames[0]=" + fileNames[0]);
      var ccInfo = [];

      // Group images by telescope and resolution
      var LDD_groups = getLDDgroups(fileNames);

      if (LDD_groups.length > 4) {
            throwFatalError("too many LDD groups: " + LDD_groups.length);
      }

      // For each group, generate own defect information
      for (var i = 0; i < LDD_groups.length; i++) {
            console.writeln("runLinearDefectDetection, group " + i);
            var ccGroupInfo = getDefectInfo(LDD_groups[i].groupfiles);
            ccInfo[ccInfo.length] = ccGroupInfo;
      }

      return ccInfo;
}

function generateNewFileName(fileName, outputdir, postfix, extension)
{
      return ensurePathEndSlash(outputdir) + File.extractName(fileName) + postfix + extension;
}

function generateNewFileNames(oldFileNames, outputdir, postfix, extension)
{
      var newFileNames = [];

      console.writeln("generateNewFileNames, old " + oldFileNames[0]);

      for (var i = 0; i < oldFileNames.length; i++) {
            newFileNames[i] = generateNewFileName(oldFileNames[i], outputdir, postfix, extension);
      }

      console.writeln("generateNewFileNames, new " + newFileNames[0]);
      return newFileNames;
}

function isLuminanceFile(filtered_files, filePath)
{
      var Lfiles = filtered_files.allfilesarr[channels.L].files;
      for (var i = 0; i < Lfiles.length; i++) {
            if (Lfiles[i].name == filePath) {
                  return true;
            }
      }
      return false;
}

function runBinningOnLights(fileNames, filtered_files)
{
      var newFileNames = [];
      var outputDir = outputRootDir + AutoOutputDir;
      var postfix = "_b2";
      var outputExtension = ".xisf";
 
      addProcessingStep("do 2x2 binning using IntegerResample on light files, output *" + postfix + ".xisf");
      console.writeln("runBinningOnLights input[0] " + fileNames[0]);

      for (var i = 0; i < fileNames.length; i++) {
            var do_binning = true;
            if (par.binning.val == 1) {
                  // Binning is done only for color channels, check if this is luminance file
                  if (isLuminanceFile(filtered_files, fileNames[i])) {
                        do_binning = false;
                  }
            }
            if (do_binning) {
                  // Open source image window from a file
                  var imageWindows = ImageWindow.open(fileNames[i]);
                  if (imageWindows.length != 1) {
                        throwFatalError("*** runBinningOnLights Error: imageWindows.length: " + imageWindows.length);
                  }
                  var imageWindow = imageWindows[0];
                  if (imageWindow == null) {
                        throwFatalError("*** runBinningOnLights Error: Can't read file: " + fileNames[i]);
                  }

                  var P = new IntegerResample;
                  P.zoomFactor = -2;
                  P.noGUIMessages = true;

                  imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

                  P.executeOn(imageWindow.mainView, false);
                  
                  imageWindow.mainView.endProcess();

                  updateBinningKeywords(imageWindow, 2);
            
                  var filePath = generateNewFileName(fileNames[i], outputDir, postfix, outputExtension);

                  // Save window
                  if (!writeImage(filePath, imageWindow)) {
                        throwFatalError("*** runBinningOnLights Error: Can't write output image: " + imageWindow.mainView.id + ", file: " + filePath);
                  }
                  // Close window
                  forceCloseOneWindow(imageWindow);
            } else{
                  // keep the old file name
                  var filePath = fileNames[i];
            }

            newFileNames[newFileNames.length] = filePath;
      }

      console.writeln("runBinningOnLights output[0] " + newFileNames[0]);

      return newFileNames;
}

function runABEOnLights(fileNames)
{
      var newFileNames = [];
      var outputDir = outputRootDir + AutoOutputDir;
      var postfix = "_ABE";
      var outputExtension = ".xisf";

      addProcessingStep("run ABE on on light files, output *" + postfix + ".xisf");
      console.writeln("runABEOnLights input[0] " + fileNames[0]);

      for (var i = 0; i < fileNames.length; i++) {
            // Open source image window from a file
            var imageWindows = ImageWindow.open(fileNames[i]);
            if (imageWindows.length != 1) {
                  throwFatalError("*** runABEOnLights Error: imageWindows.length: " + imageWindows.length);
            }
            var imageWindow = imageWindows[0];
            if (imageWindow == null) {
                  throwFatalError("*** runABEOnLights Error: Can't read file: " + fileNames[i]);
            }
            
            // Run ABE which creates a new window with _ABE extension
            var new_id = runABEex(imageWindow, false, postfix);
            var new_win = findWindow(new_id);
            if (new_win == null) {
                  throwFatalError("*** runABEOnLights Error: could not find window: " + new_id);
            }
            
            // Source image window is not needed any more
            forceCloseOneWindow(imageWindow);

            var filePath = generateNewFileName(fileNames[i], outputDir, postfix, outputExtension);

            // Save ABE window
            if (!writeImage(filePath, new_win)) {
                  throwFatalError("*** runABEOnLights Error: Can't write output image: " + new_id);
            }
            // Close ABE window
            forceCloseOneWindow(new_win);

            newFileNames[newFileNames.length] = filePath;
      }

      console.writeln("runABEOnLights output[0] " + newFileNames[0]);

      return newFileNames;
}

function runCosmeticCorrection(fileNames, defects, color_images)
{
      if (defects.length > 0) {
            addProcessingStep("run CosmeticCorrection, output *_cc.xisf, number of line defects to fix is " + defects.length);
      } else {
            addProcessingStep("run CosmeticCorrection, output *_cc.xisf, no line defects to fix");
      }
      console.writeln("fileNames[0] " + fileNames[0]);

      var P = new CosmeticCorrection;
      P.targetFrames = filesNamesToEnabledPath(fileNames);
      P.overwrite = true;
      if (color_images && par.debayerPattern.val != 'None') {
            P.cfa = true;
      } else {
            P.cfa = false;
      }
      P.outputDir = outputRootDir + AutoOutputDir;
      P.useAutoDetect = true;
      P.hotAutoCheck = true;
      P.hotAutoValue = par.cosmetic_correction_hot_sigma.val;
      P.coldAutoCheck = true;
      P.coldAutoValue = par.cosmetic_correction_cold_sigma.val;
      if (defects.length > 0) {
            P.useDefectList = true;
            P.defects = defects; // [ defectEnabled, defectIsRow, defectAddress, defectIsRange, defectBegin, defectEnd ]
      } else {
            P.useDefectList = false;
            P.defects = [];
      }

      console.writeln("runCosmeticCorrection:executeGlobal");

      P.executeGlobal();
      
      fileNames = generateNewFileNames(fileNames, P.outputDir, P.postfix, P.outputExtension);
      console.writeln("runCosmeticCorrection output[0] " + fileNames[0]);

      return fileNames;
}

function getStandardDeviationAndMean(array)
{
      const n = array.length;
      const mean = array.reduce((a, b) => a + b) / n;
      const std = Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
      return { mean: mean, std: std };
}

function findOutlierMinMax(measurements, indexvalue)
{
      if (par.outliers_method.val == 'IQR') {
            // Use IQR for filtering
            var values = measurements.concat();
      
            values.sort( function(a, b) {
                  return a[indexvalue] - b[indexvalue];
            });
      
            var q1 = values[Math.floor((values.length / 4))][indexvalue];
            var q3 = values[Math.ceil((values.length * (3 / 4)))][indexvalue];
            var iqr = q3 - q1;
      
            console.writeln("findOutlierMinMax q1 " + q1 + ", q3 " + q3 + ", iqr " + iqr);

            return { maxValue: q3 + iqr * 1.5, 
                     minValue: q1 - iqr * 1.5 };

      } else {
            // Use one or two sigma for filtering
            if (par.outliers_method.val == 'Two sigma') {
                  var sigma_count = 2;
            } else {
                  var sigma_count = 1;
            }
            var number_array = []
            for (var i = 0; i < measurements.length; i++) {
                  number_array[number_array.length] = measurements[i][indexvalue];
            }
            var mean_std = getStandardDeviationAndMean(number_array);

            console.writeln("findOutlierMinMax mean " + mean_std.mean + ", std " + mean_std.std);

            return { maxValue: mean_std.mean + sigma_count * mean_std.std, 
                     minValue: mean_std.mean - sigma_count * mean_std.std };
      }
}

function filterOutliers(measurements, name, index, type, do_filtering, fileindex, filtered_files)
{
      if (measurements.length < 8) {
            console.writeln("filterOutliers requires at last eight images, number of images is " + measurements.length);
            return measurements;
      }

      var minmax = findOutlierMinMax(measurements, index);

      console.writeln(name + " outliers min " + minmax.minValue + ", max " + minmax.maxValue);

      if (!do_filtering) {
            console.writeln("Outliers are not filtered");
            return measurements;
      }

      console.writeln("filterOutliers");

      var newMeasurements = [];
      for (var i = 0; i < measurements.length; i++) {
            if ((type == 'min' || par.outliers_minmax.val) && measurements[i][index] < minmax.minValue) {
                  console.writeln(name + " below limit " + minmax.maxValue + ", ignoring file " + measurements[i][fileindex]);
                  filtered_files[filtered_files.length] = measurements[i];
            } else if ((type == 'max' || par.outliers_minmax.val) && measurements[i][index] > minmax.maxValue) {
                  console.writeln(name + " above limit " + minmax.maxValue + ", ignoring file " + measurements[i][fileindex]);
                  filtered_files[filtered_files.length] = measurements[i];
            } else {
                  newMeasurements[newMeasurements.length] = measurements[i];
            }
      }
      addProcessingStep(name + " outliers filtered " + (measurements.length - newMeasurements.length) + " files");
      return newMeasurements;
}

function filterLimit(measurements, name, index, limit_val, fileindex, filtered_files)
{
      if (limit_val == 0) {
            console.writeln("No limit filter");
            return measurements;
      }

      console.writeln("filterLimit "+ limit_val);

      var newMeasurements = [];
      for (var i = 0; i < measurements.length; i++) {
            if (measurements[i][index] < limit_val) {
                  console.writeln(name + " below limit " + limit_val + ", ignoring file " + measurements[i][fileindex]);
                  filtered_files[filtered_files.length] = measurements[i];
            } else {
                  newMeasurements[newMeasurements.length] = measurements[i];
            }
      }
      addProcessingStep(name + " limit filtered " + (measurements.length - newMeasurements.length) + " files");
      return newMeasurements;
}

function getScaledValNeg(val, min, max)
{
      if (min == max) {
            return 0.5;
      } else {
            return 1-(val-min)/(max-min);
      }
}

function getScaledValPos(val, min, max)
{
      if (min == max) {
            return 0.5;
      } else {
            return (val-min)/(max-min);
      }
}

function SubframeSelectorMeasure(fileNames, weight_filtering, treebox_filtering)
{
      console.writeln("SubframeSelectorMeasure, input[0] " + fileNames[0]);

      var indexPath = 3;
      var indexWeight = 4;
      var indexFWHM = 5;
      var indexEccentricity = 6;
      var indexPSFSignal = 7;
      var indexPSFPower = 8;
      var indexStars = 14;
      /* Index for indexSNRWeight has changed at some point.
       * I assume it is in old position before version 1.8.8.10.
       */
      if (pixinsight_version_num < 1080810) {
            var indexSNRWeight = 7;
      } else {
            var indexSNRWeight = 9;
      }

      var measurements = null;

      if (saved_measurements != null) {
            // Find old measurements from saved_measurements
            console.writeln("SubframeSelectorMeasure, use saved measurements");
            measurements = [];
            for (var i = 0; i < fileNames.length; i++) {
                  var found = false;
                  for (var j = 0; j < saved_measurements.length; j++) {
                        if (saved_measurements[j][indexPath] == fileNames[i]) {
                              measurements[measurements.length] = saved_measurements[j];
                              found = true;
                              break;
                        }
                  }
                  if (!found) {
                        // something went wrong, list are not compatible, generate new ones
                        console.writeln("SubframeSelectorMeasure, saved measurements not found for " + fileNames[i]);
                        measurements = null;
                        break;
                  }
            }
      }
      if (measurements == null) {
            // collect new measurements
            console.writeln("SubframeSelectorMeasure, collect measurements");
            var P = new SubframeSelector;
            P.nonInteractive = true;
            P.subframes = filesNamesToEnabledPath(fileNames);     // [ subframeEnabled, subframePath ]
            P.noiseLayers = 2;
            P.outputDirectory = outputRootDir + AutoOutputDir;
            P.overwriteExistingFiles = true;
            /*
            P.measurements = [ 
                  measurementIndex, measurementEnabled, measurementLocked, measurementPath, measurementWeight,                                              0-4
                  measurementFWHM, measurementEccentricity, measurementPSFSignalWeight, measurementPSFPowerWeight, measurementSNRWeight,                    5-9
                  measurementMedian, measurementMedianMeanDev, measurementNoise, measurementNoiseRatio, measurementStars,                                   10-14
                  measurementStarResidual, measurementFWHMMeanDev, measurementEccentricityMeanDev, measurementStarResidualMeanDev, measurementAzimuth,      15-19
                  measurementAltitude                                                                                                                       20
            ];
            */
            
            P.executeGlobal();
            saved_measurements = P.measurements;
            measurements = P.measurements;
      }

      // Close measurements and expressions windows
      closeAllWindowsSubstr("SubframeSelector");

      // We filter outliers here so they are not included in the
      // min/max calculations below
      var filtered_files = [];
      measurements = filterOutliers(measurements, "FWHM", indexFWHM, 'max', par.outliers_fwhm.val, indexPath, filtered_files);
      measurements = filterOutliers(measurements, "Eccentricity", indexEccentricity, 'max', par.outliers_ecc.val, indexPath, filtered_files);
      measurements = filterOutliers(measurements, "SNR", indexSNRWeight, 'min', par.outliers_snr.val, indexPath, filtered_files);
      if (pixinsight_version_num >= 1080810) {
            measurements = filterOutliers(measurements, "PSF Signal", indexPSFSignal, 'min', par.outliers_psfsignal.val, indexPath, filtered_files);
            measurements = filterOutliers(measurements, "PSF Power", indexPSFPower, 'min', par.outliers_psfpower.val, indexPath, filtered_files);
      }
      measurements = filterOutliers(measurements, "Stars", indexStars, 'min', par.outliers_stars.val, indexPath, filtered_files);

      console.writeln("SubframeSelectorMeasure:calculate weight");

      /* Calculate weight */
      var FWHMMin = findMin(measurements, indexFWHM);
      var FWHMMax = findMax(measurements, indexFWHM);
      var EccentricityMin = findMin(measurements, indexEccentricity);
      var EccentricityMax = findMax(measurements, indexEccentricity);
      var SNRWeightMin = findMin(measurements, indexSNRWeight);
      var SNRWeightMax = findMax(measurements, indexSNRWeight);
      if (pixinsight_version_num >= 1080810) {
            var PSFSignalMin = findMin(measurements, indexPSFSignal);
            var PSFSignalMax = findMax(measurements, indexPSFSignal);
            var PSFPowerMin = findMin(measurements, indexPSFPower);
            var PSFPowerMax = findMax(measurements, indexPSFPower);
      } else {
            var PSFSignalMin = 0;
            var PSFSignalMax = 0;
            var PSFPowerMin = 0;
            var PSFPowerMax = 0;
      }
      var StarsMin = findMin(measurements, indexStars);
      var StarsMax = findMax(measurements, indexStars);

      console.writeln("FWHMMin " + FWHMMin + ", EccMin " + EccentricityMin + ", SNRMin " + SNRWeightMin + ", PSFSignalMin " + PSFSignalMin + ", PSFPowerMin " + PSFPowerMin + ", StarsMin " + StarsMin);
      console.writeln("FWHMMax " + FWHMMax + ", EccMax " + EccentricityMax + ", SNRMax " + SNRWeightMax + ", PSFSignalMax " + PSFSignalMax + ", PSFPowerMax " + PSFPowerMax + ", StarsMax " + StarsMax);

      if (0 && pixinsight_version_num >= 1080810) {
            // I think indexPSFSignal works better than actual SNRWeight
            indexSNRWeight = indexPSFSignal;
            SNRWeightMin = PSFSignalMin;
            SNRWeightMax = PSFSignalMax;
      }

      for (var i = 0; i < measurements.length; i++) {
            var FWHM = measurements[i][indexFWHM];
            var Eccentricity = measurements[i][indexEccentricity];
            var SNRWeight = measurements[i][indexSNRWeight];
            var SSWEIGHT;
            /* Defaults below for Noise, Stars and Generic options are from script Weighted Batch Preprocessing v1.4.0
             * https://www.tommasorubechi.it/2019/11/15/the-new-weighted-batchpreprocessing/
             */
            switch (par.use_weight.val) {
                  case 'Generic':
                        /* Generic weight.
                         */
                        SSWEIGHT = 20*getScaledValNeg(FWHM, FWHMMin, FWHMMax) + 
                              15*getScaledValNeg(Eccentricity, EccentricityMin, EccentricityMax) + 
                              25*getScaledValPos(SNRWeight, SNRWeightMin, SNRWeightMax) +
                              40;
                        break;
                  case 'Noise':
                        /* More weight on noise.
                         */
                        SSWEIGHT = 5*getScaledValNeg(FWHM, FWHMMin, FWHMMax) + 
                              10*getScaledValNeg(Eccentricity, EccentricityMin, EccentricityMax) + 
                              20*getScaledValPos(SNRWeight, SNRWeightMin, SNRWeightMax) +
                              65;
                        break;
                  case 'Stars':
                        /* More weight on stars.
                         */
                        SSWEIGHT = 35*getScaledValNeg(FWHM, FWHMMin, FWHMMax) + 
                              35*getScaledValNeg(Eccentricity, EccentricityMin, EccentricityMax) + 
                              20*getScaledValPos(SNRWeight, SNRWeightMin, SNRWeightMax) +
                              10;
                        break;
                  case 'PSF Signal':
                        if (pixinsight_version_num < 1080810) {
                              throwFatalError("Option " + par.use_weight.val + " is not supported in this version of PixInsight");
                        }
                        SSWEIGHT = measurements[i][indexPSFSignal] + 1; // Add one to avoid zero value
                        break;
                  case 'PSF Signal scaled':
                        if (pixinsight_version_num < 1080810) {
                              throwFatalError("Option " + par.use_weight.val + " is not supported in this version of PixInsight");
                        }
                        SSWEIGHT = 99 * getScaledValPos(measurements[i][indexPSFSignal], PSFSignalMin, PSFSignalMax) + 1;
                        break;
                  case 'FWHM scaled':
                        SSWEIGHT = 99 * getScaledValNeg(measurements[i][indexFWHM], FWHMMin, FWHMMax) + 1;
                        break;
                  case 'Eccentricity scaled':
                        SSWEIGHT = 99 * getScaledValNeg(measurements[i][indexEccentricity], EccentricityMin, EccentricityMax) + 1;
                        break;
                  case 'SNR scaled':
                        SSWEIGHT = 99 * getScaledValPos(measurements[i][indexSNRWeight], SNRWeightMin, SNRWeightMax) + 1;
                        break;
                  case 'Star count':
                        SSWEIGHT = measurements[i][indexStars] + 1;      // Add one to avoid zero value
                        break;
                  default:
                        throwFatalError("Invalid option " + par.use_weight.val);
            }
            addProcessingStep("SSWEIGHT " + SSWEIGHT + ", FWHM " + FWHM + ", Ecc " + Eccentricity + ", SNR " + SNRWeight + 
                              ", Stars " + measurements[i][indexStars] + ", PSFSignal " + measurements[i][indexPSFSignal] + ", PSFPower " + measurements[i][indexPSFPower] +
                              ", " + measurements[i][indexPath]);
            // set SSWEIGHT to indexWeight column
            measurements[i][indexWeight] = SSWEIGHT;
      }
      console.writeln("SSWEIGHTMin " + findMin(measurements, indexWeight) + " SSWEIGHTMax " + findMax(measurements, indexWeight));
      measurements = filterOutliers(measurements, "SSWEIGHT", indexWeight, 'min', par.outliers_ssweight.val, indexPath, filtered_files);
      measurements = filterLimit(measurements, "SSWEIGHT", indexWeight, par.ssweight_limit.val, indexPath, filtered_files);
      
      var ssFiles = [];
      for (var i = 0; i < measurements.length; i++) {
            ssFiles[ssFiles.length] = [ measurements[i][indexPath], measurements[i][indexWeight] ];
      }

      if (weight_filtering) {
            if (pixinsight_version_num < 1080810) {
                  var filteredSortIndex = indexFWHM;
            } else {
                  var filteredSortIndex = indexPSFSignal;
            }
            filtered_files.sort( function(a, b) {
                  return b[filteredSortIndex] - a[filteredSortIndex];
            });
            measurements.sort( function(a, b) {
                  return b[indexWeight] - a[indexWeight];
            });
            console.writeln("SubframeSelectorMeasure, " + filtered_files.length + " discarded files");
            for (var i = 0; i < filtered_files.length; i++) {
                  console.writeln(filtered_files[i][indexPath]);
            }
            console.writeln("SubframeSelectorMeasure, " + measurements.length + " accepted files");
            for (var i = 0; i < measurements.length; i++) {
                  console.writeln(measurements[i][indexPath]);
            }
            /* Create AutoWeights.json file sorted by weight. 
             */
            var treeboxfiles = [];
            // add selected files as checked
            for (var i = 0; i < measurements.length; i++) {
                  treeboxfiles[treeboxfiles.length] =  [ measurements[i][indexPath], true ];
            }
            // add filtered files as unchecked
            for (var i = 0; i < filtered_files.length; i++) {
                  treeboxfiles[treeboxfiles.length] =  [ filtered_files[i][indexPath], false ];
            }
            if (treebox_filtering) {
                  return treeboxfiles;
            } else {
                  if (treeboxfiles.length == 0) {
                        console.noteln("No files, AutoWeights.json not written");
                  } else {
                        // create Json output string
                        let fileInfoList = [];
                        addJsonFileInfo(fileInfoList, pages.LIGHTS, treeboxfiles, null);
                        let saveInfo = initJsonSaveInfo(fileInfoList, false);
                        console.writeln("saveInfo " + saveInfo);
                        let saveInfoJson = JSON.stringify(saveInfo, null, 2);
                        console.writeln("saveInfoJson " + saveInfoJson);
                        // save to a file
                        let weightsFile = ensure_win_prefix("AutoWeights.json");
                        let outputDir = getOutputDir(treeboxfiles[0][0]);
                        let outputFile = outputDir + weightsFile;
                        console.noteln("Write processing steps to " + outputFile);
                        var file = new File();
                        file.createForWriting(outputFile);
                        file.outTextLn(saveInfoJson);
                        file.close();
                  }      
                  return ssFiles;
            }
      } else {
            console.writeln("SubframeSelectorMeasure, output[0] " + ssFiles[0][0]);
            return ssFiles;
      }
}

function runSubframeSelector(fileNames)
{
      addProcessingStep("runSubframeSelector");
      console.writeln("input[0] " + fileNames[0]);
      
      var ssWeights = SubframeSelectorMeasure(fileNames, par.image_weight_testing.val, false);
      // SubframeSelectorOutput(P.measurements); Does not write weight keyword

      var newFileNames = [];

      if (par.image_weight_testing.val) {
            // Do not generate output files
            var postfix = "";
            for (var i = 0; i < ssWeights.length; i++) {
                  var filePath = ssWeights[i][0];
                  if (filePath != null && filePath != "") {
                        newFileNames[newFileNames.length] = filePath;
                  }
            }
      } else {
            /* Basically we could skip writing SSWEIGHT to output files as we have that
            * information in memory. But for some cases like starting from ImageIntegration
            * and printing best files for each channel it is useful to write
            * output files with SSWEIGHT on them.
            */
            var outputDir = outputRootDir + AutoOutputDir;
            var postfix = "_a";
            var outputExtension = ".xisf";
            for (var i = 0; i < ssWeights.length; i++) {
                  var filePath = ssWeights[i][0];
                  if (filePath != null && filePath != "") {
                        var SSWEIGHT = ssWeights[i][1];
                        var newFilePath = generateNewFileName(filePath, outputDir, postfix, outputExtension);
                        console.writeln("Writing file " + newFilePath + ", SSWEIGHT=" + SSWEIGHT);
                        var imageWindows = ImageWindow.open(filePath);
                        if (imageWindows.length != 1) {
                              console.writeln("*** Error: imageWindows.length: ", imageWindows.length);
                              continue;
                        }
                        var imageWindow = imageWindows[0];
                        if (imageWindow == null) {
                              console.writeln("*** Error: Can't read subframe: ", filePath);
                              continue;
                        }
                        setSSWEIGHTkeyword(imageWindow, SSWEIGHT);
                        if (!writeImage(newFilePath, imageWindow)) {
                              forceCloseOneWindow(imageWindow);
                              console.writeln(
                              "*** Error: Can't write output image: ", newFilePath
                              );
                              continue;
                        }         
                        forceCloseOneWindow(imageWindow);
                  }
                  newFileNames[newFileNames.length] = newFilePath;
            }
      }
      addProcessingStep("runSubframeSelector, input " + fileNames.length + " files, output " + newFileNames.length + " files");
      console.writeln("output[0] " + newFileNames[0]);

      var names_and_weights = { filenames: newFileNames, ssweights: ssWeights, postfix: postfix };
      return names_and_weights;
}

function findBestSSWEIGHT(names_and_weights)
{
      var ssweight;
      var fileNames = names_and_weights.filenames;
      var newFileNames = [];

      if (names_and_weights.ssweights.length > 0
          && names_and_weights.filenames.length != names_and_weights.ssweights.length) 
      {
            // we have inconsistent lengths
            throwFatalError("Inconsistent lengths, filenames.length=" + names_and_weights.filenames.length + ", ssweights.length=" + names_and_weights.ssweights.length);
      }

      run_HT = true;
      best_ssweight = 0;
      best_image = null;

      /* Loop through files and find image with best SSWEIGHT.
       */
      addProcessingStep("Find best SSWEIGHT");
      var n = 0;
      var first_image = true;
      var best_ssweight_naxis = 0;
      var user_specified_best_image = null;
      for (var i = 0; i < fileNames.length; i++) {
            var filePath = fileNames[i];
            var ext = '.' + filePath.split('.').pop();
            console.writeln("File " +  filePath + " ext " +  ext);
            if (ext.toUpperCase() == '.FIT' || ext.toUpperCase() == '.XISF') {
                  run_HT = true;
            } else {
                  run_HT = false;
            }
            var keywords = getFileKeywords(filePath);

            n++;

            // First get naxis1 since we do not know
            // the order for keywords
            var naxis1 = 0;
            for (var j = 0; j < keywords.length; j++) {
                  var value = keywords[j].strippedValue.trim();
                  switch (keywords[j].name) {
                        case "TELESCOP":
                              console.writeln("telescop=" +  value);
                              break;
                        case "NAXIS1":
                              console.writeln("naxis1=" + value);
                              naxis1 = parseInt(value);
                              break;
                        default:
                              break;
                  }
            }
            var accept_file = true;
            var ssweight_found = false;
            if (fileNames[i].indexOf("best_image") != -1) {
                  // User has marked this image as the best
                  user_specified_best_image = fileNames[i];
                  console.writeln("found text 'best_image' from file name");
            }
            if (names_and_weights.ssweights.length > i) {
                  // take SSWEIGHT from the calculated array
                  ssweight_found = true;
                  ssweight = names_and_weights.ssweights[i][1].toFixed(3);
                  console.writeln("calculated ssweight=" +  ssweight);
            } else {
                  // try to find SSWEIGHT from the file
                  for (var j = 0; j < keywords.length; j++) {
                        var value = keywords[j].strippedValue.trim();
                        switch (keywords[j].name) {
                              case "SSWEIGHT":
                                    ssweight_found = true;
                                    ssweight = value;
                                    console.writeln("file ssweight=" +  ssweight);
                                    break;
                              default:
                                    break;
                        }
                  }
            }
            if (ssweight_found) {
                  ssweight_set = true;
                  var ssweight_float = parseFloat(ssweight);
                  if (ssweight_float < par.ssweight_limit.val) {
                        console.writeln("below ssweight limit " + par.ssweight_limit.val + ", skip image");
                        accept_file = false;
                  } else {
                        if (!first_image && naxis1 > best_ssweight_naxis) {
                              addProcessingStep("  Files have different resolution, using bigger NAXIS1="+naxis1+" for best SSWEIGHT");
                        }
                        if (first_image || 
                              naxis1 > best_ssweight_naxis ||
                              (ssweight_float > parseFloat(best_ssweight) &&
                              naxis1 == best_ssweight_naxis))
                        {
                              /* Set a new best image if
                              - this is the first image
                              - this has a bigger resolution
                              - this has a bigger SSWEIGHT value and is the same resolution
                              */
                              best_ssweight = ssweight;
                              console.writeln("new best_ssweight=" +  best_ssweight);
                              best_image = filePath;
                              best_ssweight_naxis = naxis1;
                              first_image = false;
                        }
                  }
            }
            if (accept_file) {
                  newFileNames[newFileNames.length] = fileNames[i];
            }
      }
      if (newFileNames.length == 0) {
            throwFatalError("No files found for processing.");
      }
      if (user_specified_best_image != null) {
            console.writeln("Using user specified best image " + user_specified_best_image);
            best_image = user_specified_best_image;
            if (best_ssweight < 100.0) {
                  best_ssweight = 100.0;
            } else {
                  // maybe user given SSWEIGHT 
                  best_ssweight = best_ssweight + 1.0;
            }
      } else if (best_image == null) {
            console.writeln("Unable to find image with best SSWEIGHT, using first image");
            best_image = newFileNames[0];
            best_ssweight = 1.0;
      }
      return [ best_image, newFileNames ];
}

function filterByFileName(filePath, filename_postfix)
{
      var splitname = filePath.split('.');
      var basename = splitname[splitname.length - 2];
      var filter = basename.slice(0, basename.length - filename_postfix.length).slice(-2);
      
      console.writeln("filterByFileName:filePath=" + filePath + ", filter=" + filter);
      
      // Create filter based of file name ending.
      switch (filter) {
            case '_L':
                  return 'L';
            case '_R':
                  return 'R';
            case '_G':
                  return 'G';
            case '_B':
                  return 'B';
            case '_S':
                  return 'S';
            case '_H':
                  return 'H';
            case '_O':
                  return 'O';
            default:
                  break;
      }
      return null;
}

function updateFilesInfo(files, filearr, txt)
{
      console.writeln("updateFilesInfo, " + filearr.length + " " + txt + " files");
      for (var i = 0; i < filearr.length; i++) {
            if (files.best_image == null || parseFloat(filearr[i].ssweight) >= parseFloat(files.best_ssweight)) {
                  /* Add best images first in the array. */
                  files.best_ssweight = filearr[i].ssweight;
                  console.writeln(txt + " new best_ssweight=" +  parseFloat(files.best_ssweight));
                  files.best_image = filearr[i].name;
                  insert_image_for_integrate(files.images, filearr[i].name);
            } else {
                  append_image_for_integrate(files.images, filearr[i].name);
            }
            files.exptime += filearr[i].exptime;
      }
}

function init_images()
{
      return { images: [], best_image: null, best_ssweight: 0, exptime: 0 };
}

function getFileKeywords(filePath)
{
      console.writeln("getFileKeywords " + filePath);
      var keywords = [];

      var ext = '.' + filePath.split('.').pop();
      var F = new FileFormat(ext, true/*toRead*/, false/*toWrite*/);
      if (F.isNull) {
            throwFatalError("No installed file format can read \'" + ext + "\' files."); // shouldn't happen
      }
      var f = new FileFormatInstance(F);
      if (f.isNull) {
            throwFatalError("Unable to instantiate file format: " + F.name);
      }
      var info = f.open(filePath, "verbosity 0"); // do not fill the console with useless messages
      if (info.length <= 0) {
            throwFatalError("Unable to open input file: " + filePath);
      }
      if (F.canStoreKeywords) {
            keywords = f.keywords;
      }
      f.close();

      return keywords;
}

// Filter files based on filter keyword/file name.
// files array can be either simple file name array
// or array having [ filename, checked ] members
function getFilterFiles(files, pageIndex, filename_postfix)
{
      var luminance = false;
      var rgb = false;
      var narrowband = false;
      var ssweight_set = false;
      var allfilesarr = [];
      var error_text = "";
      var color_files = false;
      var filterSet = null;

      var allfiles = {
            L: [], R: [], G: [], B: [], H: [], S: [], O: [], C: []
      };

      switch (pageIndex) {
            case pages.LIGHTS:
                  filterSet = lightFilterSet;
                  break;
            case pages.FLATS:
                  filterSet = flatFilterSet;
                  break;
      }

      if (filterSet != null) {
            clearFilterFileUsedFlags(filterSet);
      }

      /* Collect all different file types and some information about them.
       */
      var n = 0;
      for (var i = 0; i < files.length; i++) {
            var filter = null;
            var ssweight = '0';
            var exptime = 0;
            var obj = files[i];
            if (Array.isArray(obj)) {
                  var filePath = obj[0];
                  var checked = obj[1];
            } else {
                  var filePath = obj;
                  var checked = true;
            }
            
            console.writeln("getFilterFiles file " +  filePath);

            if (filterSet != null) {
                  filter = findFilterForFile(filterSet, filePath, filename_postfix);
            }

            var keywords = getFileKeywords(filePath);
            n++;
            for (var j = 0; j < keywords.length; j++) {
                  var value = keywords[j].strippedValue.trim();
                  switch (keywords[j].name) {
                        case "FILTER":
                        case "INSFLNAM":
                              if (filter != null) {
                                    console.writeln("filter already found, ignored "+ keywords[j].name + "=" +  value);
                              } else if (!par.skip_autodetect_filter.val) {
                                    console.writeln(keywords[j].name + "=" + value);
                                    filter = value;
                              } else {
                                    console.writeln("ignored " + keywords[j].name + "=" +  value);
                              }
                              break;
                        case "SSWEIGHT":
                              ssweight = value;
                              console.writeln("SWEIGHT=" +  ssweight);
                              ssweight_set = true;
                              break;
                        case "TELESCOP":
                              console.writeln("TELESCOP=" +  value);
                              if (pageIndex == pages.LIGHTS
                                  && par.debayerPattern.val == 'Auto'
                                  && value.search(/slooh/i) != -1
                                  && value.search(/T3/) != -1) 
                              {
                                    console.writeln("Set debayer pattern from Auto to None");
                                    par.debayerPattern.val = 'None';
                              }
                              break;
                        case "NAXIS1":
                              console.writeln("NAXIS1=" + value);
                              break;
                        case "EXPTIME":
                        case "EXPOSURE":
                              console.writeln(keywords[j].name + "=" + value);
                              exptime = parseFloat(value);
                              break;
                        default:
                              break;
                  }
            }

            if (filter != null && filter.trim().substring(0, 1) == 'F') {
                  // Hubble FILTER starts with F, force using file name
                  filter = null;
            }
            if (filter == null || par.force_file_name_filter.val) {
                  // No filter keyword. Try mapping based on file name.
                  filter = filterByFileName(filePath, filename_postfix);
            }
            if (filter == null) {
                  filter = 'Color';
            }
            if (par.monochrome_image.val) {
                  console.writeln("Create monochrome image, set filter = Luminance");
                  filter = 'Luminance';
            }
            // First check with full filter name
            switch (filter.trim()) {
                  case 'Luminance':
                  case 'Lum':
                  case 'Clear':
                        filter = 'L';
                        break;
                  case 'Red':
                        filter = 'R';
                        break;
                  case 'Green':
                        filter = 'G';
                        break;
                  case 'Blue':
                        filter = 'B';
                        break;
                  case 'Halpha':
                  case 'Ha':
                        filter = 'H';
                        break;
                  case 'SII':
                        filter = 'S';
                        break;
                  case 'OIII':
                        filter = 'O';
                        break;
                  case 'Color':
                  case 'No filter':
                        filter = 'C';
                        break;
                  default:
                        break;
            }
            // Do final resolve based on first letter in the filter'
            var filter_keyword = filter.trim().substring(0, 1);
            switch (filter_keyword) {
                  case 'L':
                  case 'l':
                        if (allfiles.L.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.L[allfiles.L.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        luminance = true;
                        break;
                  case 'R':
                  case 'r':
                        if (allfiles.R.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.R[allfiles.R.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        rgb = true;
                        break;
                  case 'G':
                  case 'g':
                        if (allfiles.G.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.G[allfiles.G.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        rgb = true;
                        break;
                  case 'B':
                  case 'b':
                        if (allfiles.B.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.B[allfiles.B.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        rgb = true;
                        break;
                  case 'H':
                  case 'h':
                        if (allfiles.H.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.H[allfiles.H.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        narrowband = true;
                        break;
                  case 'S':
                  case 's':
                        if (allfiles.S.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.S[allfiles.S.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        narrowband = true;
                        break;
                  case 'O':
                  case 'o':
                        if (allfiles.O.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.O[allfiles.O.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        narrowband = true;
                        break;
                  case 'C':
                  default:
                        if (allfiles.C.length == 0) {
                              console.writeln("Found "+ filter_keyword + " files (" + filePath + ")");
                        }
                        allfiles.C[allfiles.C.length] = { name: filePath, ssweight: ssweight, exptime: exptime, filter: filter, checked: checked };
                        color_files = true;
                        break;
            }
      }

      allfilesarr[channels.L] = { files: allfiles.L, filter: 'L' };
      allfilesarr[channels.R] = { files: allfiles.R, filter: 'R' };
      allfilesarr[channels.G] = { files: allfiles.G, filter: 'G' };
      allfilesarr[channels.B] = { files: allfiles.B, filter: 'B' };
      allfilesarr[channels.H] = { files: allfiles.H, filter: 'H' };
      allfilesarr[channels.S] = { files: allfiles.S, filter: 'S' };
      allfilesarr[channels.O] = { files: allfiles.O, filter: 'O' };
      allfilesarr[channels.C] = { files: allfiles.C, filter: 'C' };

      if (color_files && (luminance || rgb || narrowband)) {
            error_text = "Error, cannot mix color and monochrome filter files";
      } else if (rgb && (allfiles.R.length == 0 || allfiles.G.length == 0 || allfiles.B.length == 0)) {
            error_text = "Error, with RBG files for all RGB channels must be given";
      }

      return { allfilesarr : allfilesarr,
               rgb : rgb, 
               narrowband : narrowband,
               color_files : color_files,
               ssweight_set : ssweight_set,
               error_text: error_text
             };
}

function getImagetypFiles(files)
{
      var allfiles = [];

      for (var i = 0; i < pages.END; i++) {
            allfiles[i] = [];
      }

      /* Collect all different image types types.
       */
      var n = 0;
      for (var i = 0; i < files.length; i++) {
            var imagetyp = null;
            var filePath = files[i];
            
            console.writeln("getImagetypFiles file " +  filePath);
            var keywords = getFileKeywords(filePath);
            n++;
            for (var j = 0; j < keywords.length; j++) {
                  var value = keywords[j].strippedValue.trim();
                  switch (keywords[j].name) {
                        case "IMAGETYP":
                              console.writeln("imagetyp=" +  value);
                              imagetyp = value;
                              break;
                        default:
                              break;
                  }
            }

            if (imagetyp == null) {
                  imagetyp = 'Light Frame';
            }
            switch (imagetyp.trim().toLowerCase()) {
                  case 'bias frame':
                  case 'bias':
                  case 'master bias':
                        allfiles[pages.BIAS][allfiles[pages.BIAS].length] = filePath;
                        break;
                  case 'dark frame':
                  case 'dark':
                  case 'master dark':
                        allfiles[pages.DARKS][allfiles[pages.DARKS].length] = filePath;
                        break;
                  case 'flat frame':
                  case 'flat field':
                  case 'flat':
                  case 'master flat':
                        allfiles[pages.FLATS][allfiles[pages.FLATS].length] = filePath;
                        break;
                  case 'flatdark':
                  case 'flat dark':
                  case 'darkflat':
                  case 'dark flat':
                  case 'master flat dark':
                        allfiles[pages.FLAT_DARKS][allfiles[pages.FLAT_DARKS].length] = filePath;
                        break;
                  case 'light frame':
                  case 'light':
                  case 'master light':
                  default:
                        allfiles[pages.LIGHTS][allfiles[pages.LIGHTS].length] = filePath;
                        break;
            }
      }
      return allfiles;
}

function findLRGBchannels(alignedFiles, filename_postfix)
{
      /* Loop through aligned files and find different channels.
       */
      addProcessingStep("Find L,R,G,B,H,S,O and color channels");

      L_images = init_images();
      R_images = init_images();
      G_images = init_images();
      B_images = init_images();
      H_images = init_images();
      S_images = init_images();
      O_images = init_images();
      C_images = init_images();

      /* Collect all different file types and some information about them.
       */
      var filter_info = getFilterFiles(alignedFiles, pages.LIGHTS, filename_postfix);

      var allfilesarr = filter_info.allfilesarr;
      var rgb = filter_info.rgb;
      is_color_files = filter_info.color_files;

      // update global variables
      narrowband = filter_info.narrowband;
      ssweight_set = filter_info.ssweight_set;

      // Check for synthetic images
      if (allfilesarr[channels.C].files.length == 0) {
            if (par.synthetic_l_image.val ||
                  (par.synthetic_missing_images.val && allfiles.L.length == 0))
            {
                  if (allfilesarr[channels.L].files.length == 0) {
                        addProcessingStep("No luminance images, synthetic luminance image from all other images");
                  } else {
                        addProcessingStep("Synthetic luminance image from all light images");
                  }
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.R].files);
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.G].files);
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.B].files);
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.H].files);
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.S].files);
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.O].files);
            }
            if (allfilesarr[channels.R].files.length == 0 && par.synthetic_missing_images.val) {
                  addProcessingStep("No red images, synthetic red image from luminance images");
                  allfilesarr[channels.R].files = allfilesarr[channels.R].files.concat(allfilesarr[channels.L].files);
            }
            if (allfilesarr[channels.G].files.length == 0 && par.synthetic_missing_images.val) {
                  addProcessingStep("No green images, synthetic green image from luminance images");
                  allfilesarr[channels.G].files = allfilesarr[channels.G].files.concat(allfilesarr[channels.L].files);
            }
            if (allfilesarr[channels.B].files.length == 0 && par.synthetic_missing_images.val) {
                  addProcessingStep("No blue images, synthetic blue image from luminance images");
                  allfilesarr[channels.B].files = allfilesarr[channels.B].files.concat(allfilesarr[channels.L].files);
            }
            if (par.RRGB_image.val) {
                  addProcessingStep("RRGB image, use R as L image");
                  console.writeln("L images " +  allfilesarr[channels.L].files.length);
                  console.writeln("R images " +  allfilesarr[channels.R].files.length);
                  allfilesarr[channels.L].files = [];
                  allfilesarr[channels.L].files = allfilesarr[channels.L].files.concat(allfilesarr[channels.R].files);
            }
      }

      updateFilesInfo(L_images, allfilesarr[channels.L].files, 'L');
      updateFilesInfo(R_images, allfilesarr[channels.R].files, 'R');
      updateFilesInfo(G_images, allfilesarr[channels.G].files, 'G');
      updateFilesInfo(B_images, allfilesarr[channels.B].files, 'B');
      updateFilesInfo(H_images, allfilesarr[channels.H].files, 'H');
      updateFilesInfo(S_images, allfilesarr[channels.S].files, 'S');
      updateFilesInfo(O_images, allfilesarr[channels.O].files, 'O');
      updateFilesInfo(C_images, allfilesarr[channels.C].files, 'C');

      if (C_images.images.length > 0) {
            // Color image
            if (L_images.images.length > 0) {
                  throwFatalError("Cannot mix color and luminance filter files");
            }
            if (R_images.images.length > 0) {
                  throwFatalError("Cannot mix color and red filter files");
            }
            if (B_images.images.length > 0) {
                  throwFatalError("Cannot mix color and blue filter files");
            }
            if (G_images.images.length > 0) {
                  throwFatalError("Cannot mix color and green filter files");
            }
      } else {
            if (par.monochrome_image.val) {
                  // Monochrome
                  if (L_images.images.length == 0) {
                        throwFatalError("No Luminance images found");
                  }
            } else if (rgb) {
                  // LRGB or RGB
                  if (R_images.images.length == 0 && !par.integrate_only.val && !par.image_weight_testing.val) {
                        throwFatalError("No Red images found");
                  }
                  if (B_images.images.length == 0 && !par.integrate_only.val && !par.image_weight_testing.val) {
                        throwFatalError("No Blue images found");
                  }
                  if (G_images.images.length == 0 && !par.integrate_only.val && !par.image_weight_testing.val) {
                        throwFatalError("No Green images found");
                  }
            }
            if (L_images.images.length > 0) {
                  // Use just RGB channels
                  is_luminance_images = true;
            }
      }
}

function isVariableChar(str) {
      return str.length === 1 && str.match(/[a-z0-9_]/i);
}

function add_missing_image(images, to)
{
      for (var i = 0; i < images.length; i++) {
            if (images[i] == to) {
                  break;
            }
      }
      if (i == images.length) {
            // not found, add to list
            images[images.length] = to;
      }
}

function ensureLightImages(ch, check_allfilesarr)
{
      for (var i = 0; i < check_allfilesarr.length; i++) {
            var filterFiles = check_allfilesarr[i].files;
            var filterName = check_allfilesarr[i].filter;
            if (filterName == ch) {
                  if (filterFiles.length == 0) {
                        throwFatalError("No " + ch + " images that are needed for PixelMath mapping");
                  }
                  break;
            }
      }
}

/* Replace tag "from" with real image name "to" with _map added to the end (H -> Integration_H_map) . 
 * Images names listed in the mapping are put into images array without _map added (Integration_H).
 */
function replaceMappingImageNames(mapping, from, to, images, check_allfilesarr)
{
      //console.writeln("replaceMappingImageNames in " + mapping + " from " + from + " to " + to);
      mapping = mapping.trim();
      var n = mapping.search(from);
      if (n == -1) {
            // not found
            //console.writeln("replaceMappingImageNames, " + from + " not found");
            return mapping;
      }
      if (mapping.length == 1) {
            // only char must be the one we are looking for
            //console.writeln("replaceMappingImageNames only one char")
            if (check_allfilesarr != null) {
                  ensureLightImages(from, check_allfilesarr);
            } else {
                  add_missing_image(images, to);
            }
            return to + "_map";
      }
      // loop until all occurrences are replaced
      for (var i = mapping.length; i > 0; i--) {
            console.writeln("replaceMappingImageNames scan " + mapping);
            for (var n = 0; n < mapping.length; n++) {
                  if (mapping.substring(n, n+1) == from) {
                        var replace = true;
                        if (n > 0 && isVariableChar(mapping.substring(n-1, n))) {
                              // nothing to replace
                              //console.writeln("replaceMappingImageNames letter before " + from);
                              replace = false;
                        } else if (n < mapping.length-1 && isVariableChar(mapping.substring(n+1, n+2))) {
                              // nothing to replace
                              //console.writeln("replaceMappingImageNames letter after " + from);
                              replace = false;
                        }
                        if (replace) {
                              if (check_allfilesarr != null) {
                                    ensureLightImages(from, check_allfilesarr);
                              } else {
                                    if (findWindowNoPrefixIf(to, run_auto_continue) == null) {
                                          throwFatalError("Could not find image window " + to + " that is needed for PixelMath mapping");
                                    }
                                    add_missing_image(images, to);
                              }
                              mapping = mapping.substring(0, n) + to + "_map" + mapping.substring(n+1);
                              //console.writeln("replaceMappingImageNames mapped to " + mapping);
                              break;
                        }
                  }
            }
            if (n == mapping.length) {
                  // all replaced
                  //console.writeln("replaceMappingImageNames, all replaced, mapped to " + mapping);
                  return mapping;
            }
      }
      console.writeln("replaceMappingImageNames, too many loop iterations, mapped to " + mapping);
      return mapping;
}

/* Get custom channel mapping and replace target images with real names.
 * Tag is changed to a real image name with _map added to the end (H -> Integration_H_map) . 
 * Images names listed in the mapping are put into images array without _map added (Integration_H).
 */
function mapCustomAndReplaceImageNames(targetChannel, images, check_allfilesarr)
{
      switch (targetChannel) {
            case 'R':
                  var mapping = par.custom_R_mapping.val;
                  break;
            case 'G':
                  var mapping = par.custom_G_mapping.val;
                  break;
            case 'B':
                  var mapping = par.custom_B_mapping.val;
                  break;
            case 'L':
                  var mapping = par.custom_L_mapping.val;
                  break;
            default:
                  console.writeln("ERROR: mapCustomAndReplaceImageNames " + targetChannel);
                  return null;
      }
      if (check_allfilesarr == null) {
            console.writeln("mapCustomAndReplaceImageNames " + targetChannel + " using " + mapping);
      }
      /* Replace letters with actual image identifiers. */
      mapping = replaceMappingImageNames(mapping, "L", ppar.win_prefix + "Integration_L", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "R", ppar.win_prefix + "Integration_R", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "G", ppar.win_prefix + "Integration_G", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "B", ppar.win_prefix + "Integration_B", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "H", ppar.win_prefix + "Integration_H", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "S", ppar.win_prefix + "Integration_S", images, check_allfilesarr);
      mapping = replaceMappingImageNames(mapping, "O", ppar.win_prefix + "Integration_O", images, check_allfilesarr);

      if (check_allfilesarr == null) {
            console.writeln("mapCustomAndReplaceImageNames:converted mapping " + mapping);
      }

      return mapping;
}

/* Run single expression PixelMath and optionally create new image. */
function runPixelMathSingleMappingEx(id, mapping, createNewImage)
{
      addProcessingStep("Run PixelMath single mapping " + mapping + " using image " + id);

      var idWin = findWindow(id);
      if (idWin == null) {
            console.writeln("ERROR: No reference window found for PixelMath");
      }

      if (createNewImage) {
            var targetFITSKeywords = getTargetFITSKeywordsForPixelmath(idWin);
      }

      var P = new PixelMath;
      P.expression = mapping;
      P.createNewImage = createNewImage;
      P.showNewImage = false;
      P.newImageId = id + "_pm";

      idWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(idWin.mainView);
      idWin.mainView.endProcess();

      if (createNewImage) {
            setTargetFITSKeywordsForPixelmath(findWindow(P.newImageId), targetFITSKeywords);
      }

      return P.newImageId;
}

/* Run single expression PixelMath and create new image. */
function runPixelMathSingleMapping(id, mapping)
{
      return runPixelMathSingleMappingEx(id, mapping, true);
}

/* Run RGB channel combination using PixelMath. 
   If we have newId we create a new image. If newId is null we
   replace target image.
*/
function runPixelMathRGBMapping(newId, idWin, mapping_R, mapping_G, mapping_B)
{
      addProcessingStep("Run PixelMath mapping R " + mapping_R + ", G " + mapping_G + ", B " + mapping_B);

      if (idWin == null) {
            idWin = findWindowCheckBaseNameIf("Integration_H", run_auto_continue);
      }
      if (idWin == null) {
            idWin = findWindowCheckBaseNameIf("Integration_S", run_auto_continue);
      }
      if (idWin == null) {
            idWin = findWindowCheckBaseNameIf("Integration_O", run_auto_continue);
      }
      if (idWin == null) {
            console.writeln("ERROR: No reference window found for PixelMath");
      }

      if (newId != null) {
            var targetFITSKeywords = getTargetFITSKeywordsForPixelmath(idWin);
      }

      var P = new PixelMath;
      P.expression = mapping_R;
      P.expression1 = mapping_G;
      P.expression2 = mapping_B;
      P.useSingleExpression = false;
      P.showNewImage = true;
      if (newId != null) {
            P.createNewImage = true;
            P.newImageId = newId;
      } else {
            P.createNewImage = false;
            P.newImageId = "";
      }
      P.newImageColorSpace = PixelMath.prototype.RGB;

      idWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(idWin.mainView);
      idWin.mainView.endProcess();

      if (newId != null) {
            setTargetFITSKeywordsForPixelmath(findWindow(newId), targetFITSKeywords);
      }

      return newId;
}

function linearFitArray(refimage, targetimages)
{
      console.writeln("linearFitArray");
      for (var i = 0; i < targetimages.length; i++) {
            if (targetimages[i] != refimage) {
                  runLinearFit(refimage, targetimages[i]);
            }
      }
}

function arrayFindImage(images, image)
{
      for (var i = 0; i < images.length; i++) {
            if (images[i] == image) {
                  return true;
            }
      }
      return false;
}

function arrayAppendCheckDuplicates(images, appimages)
{
      for (var i = 0; i < appimages.length; i++) {
            if (!arrayFindImage(images, appimages[i])) {
                  images[images.length] = appimages[i];
            }
      }
}

function findLinearFitHSOMapRefimage(images, suggestion)
{
      var refimage;
      console.writeln("findLinearFitHSOMapRefimage");
      if (suggestion == "Auto") {
            refimage = ppar.win_prefix + "Integration_O_map";
            if (arrayFindImage(images, refimage)) {
                  return(refimage);
            }
            refimage = ppar.win_prefix + "Integration_S_map";
            if (arrayFindImage(images, refimage)) {
                  return(refimage);
            }
      } else {
            refimage = ppar.win_prefix + "Integration_" + suggestion + "_map";
            if (arrayFindImage(images, refimage)) {
                  return(refimage);
            }
            throwFatalError("Could not find linear fit reference image " + suggestion);
      }
      // Just pick something
      return(images[0]);
}

/* Copy images with _map name so we do not change the original
 * images (Integration_H -> Integration_H_map).
 */
function copyToMapImages(images)
{
      console.writeln("copyToMapImages");
      for (var i = 0; i < images.length; i++) {
            var copyname = ensure_win_prefix(images[i] + "_map");
            console.writeln("copy from " + images[i] + " to " + copyname);
            copyWindow(
                  findWindowNoPrefixIf(images[i], run_auto_continue), 
                  copyname);
            images[i] = copyname;
      }
}

function mapRGBchannel(images, refimage, mapping)
{
      console.writeln("mapRGBchannel, refimage " + refimage + ", mapping " + mapping);
      // copy files to _map names to avoid changing original files
      copyToMapImages(images);
      refimage = refimage + "_map";
      console.writeln("mapRGBchannel, new refimage " + refimage);
      if (findWindow(refimage) == null) {
            refimage = images[0];
            console.writeln("mapRGBchannel, refimage from images[0] " + refimage);
      }
      if (images.length > 1) {
            // run linear fit to match images before PixelMath
            linearFitArray(refimage, images);
      }
      // create combined image
      var target_image = runPixelMathSingleMapping(refimage, mapping);
      // close all copied images as we may want use the same names in the next RGB round
      closeAllWindowsFromArray(images);
      return target_image;
}

function luminanceNoiseReduction(imgWin, maskWin)
{
      if (par.skip_noise_reduction.val || par.luminance_noise_reduction_strength.val == 0) {
            return;
      }

      addProcessingStep("Reduce noise on luminance image " + imgWin.mainView.id);

      runMultiscaleLinearTransformReduceNoise(imgWin, maskWin, par.luminance_noise_reduction_strength.val);
}

function channelNoiseReduction(image_id)
{
      if (par.skip_noise_reduction.val || par.noise_reduction_strength.val == 0) {
            return;
      }
      addProcessingStep("Reduce noise on channel image " + image_id);

      var image_win = findWindow(image_id);

      /* Create a temporary mask. */
      var mask_win = CreateNewTempMaskFromLInearWin(image_win, false);

      runMultiscaleLinearTransformReduceNoise(image_win, mask_win, par.noise_reduction_strength.val);

      closeOneWindow(mask_win.mainView.id);
}

function createNewStarXTerminator(star_mask, linear_data)
{
      try {
            console.writeln("createNewStarXTerminator, linear_data " + linear_data + ", star_mask "+ star_mask);
            var P = new StarXTerminator;
            P.linear = linear_data;
            P.stars = star_mask;
      } catch(err) {
            console.criticalln("StarXTerminator failed");
            console.criticalln(err);
            addProcessingStep("Maybe StarXTerminator is not installed, AI is missing or platform is not supported");
            throwFatalError("StarXTerminator failed");
      }
      return P;
}

function createNewStarNet(star_mask)
{
      try {
            var P = new StarNet;
            P.stride = StarNet.prototype.Stride_128;
            P.mask = star_mask;
      } catch(err) {
            console.criticalln("StarNet failed");
            console.criticalln(err);
            addProcessingStep("Maybe weight files are missing or platform is not supported");
            throwFatalError("StarNet failed");
      }
      return P;
}

// Remove stars from an image. We do not create star mask here.
function removeStars(imgWin, linear_data)
{
      if (par.use_starxterminator.val) {
            addProcessingStep("Run StarXTerminator on " + imgWin.mainView.id);
            var P = createNewStarXTerminator(false, linear_data);
      } else if (linear_data) {
            throwFatalError("StarNet cannot be used to remove stars while image is still in linear stage.");
      } else {
            addProcessingStep("Run StarNet on " + imgWin.mainView.id);
            var P = createNewStarNet(false);
      }

      /* Execute on image.
       */
      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(imgWin.mainView, false);
      
      imgWin.mainView.endProcess();
}

/* Do custom mapping of channels to RGB image. We do some of the same 
 * stuff here as in CombineRGBimage.
 */
function customMapping(check_allfilesarr)
{
      var RBGmapping = { combined: true, stretched: true};

      if (check_allfilesarr != null) {
            addProcessingStep("Check custom mapping");
      } else {
            addProcessingStep("Custom mapping");
      }

      /* Get updated mapping strings and collect images
       * used in mapping.
       */
      var R_images = [];
      var G_images = [];
      var B_images = [];

      /* Get a modified mapping with tags replaced with real image names.
       */
      var red_mapping = mapCustomAndReplaceImageNames('R', R_images, check_allfilesarr);
      var green_mapping = mapCustomAndReplaceImageNames('G', G_images, check_allfilesarr);
      var blue_mapping = mapCustomAndReplaceImageNames('B', B_images, check_allfilesarr);

      if (check_allfilesarr != null) {
            return null;
      }

      if (narrowband) {
            /* For narrowband we have two options:
             *
             * 1. Do PixelMath mapping in linear format.
             *    https://jonrista.com/the-astrophotographers-guide/PixInsights/narrow-band-combinations-with-pixelmath-hoo/
             * 2. We do auto-stretch of images before PixelMath. Stretch is done to make
             *    images roughly match with each other. In this case we have already stretched image.
             *    https://www.lightvortexastronomy.com/tutorial-narrowband-bicolour-palette-combinations.html
             *    https://www.lightvortexastronomy.com/tutorial-narrowband-hubble-palette.html
             * 
             * User can choose in the GUI interface which one to use.
             */
            var images = [];
            arrayAppendCheckDuplicates(images, R_images);
            arrayAppendCheckDuplicates(images, G_images);
            arrayAppendCheckDuplicates(images, B_images);

            /* Make a copy so we do not change the original integrated images.
             * Here we create image with _map added to the end 
             * (Integration_H -> Integration_H_map).
             */
            copyToMapImages(images);

            if (par.ABE_before_channel_combination.val) {
                  // Optionally do ABE on channel images
                  for (var i = 0; i < images.length; i++) {
                        run_ABE_before_channel_combination(images[i], false);
                  }
            }

            if (par.noise_reduction_strength.val > 0 && !par.combined_image_noise_reduction.val) {
                  // Optionally do noise reduction on color channels in linear state
                  for (var i = 0; i < images.length; i++) {
                        channelNoiseReduction(images[i]);
                  }
            }
            if (par.narrowband_linear_fit.val == "Auto"
                && par.image_stretching.val == 'Auto STF') 
            {
                  /* By default we do not do linear fit
                   * if we stretch with STF. If we stretch
                   * with MaskedStretch we use linear
                   * for to balance channels better.
                   * */
                  par.narrowband_linear_fit.val = "None";
            }
            if (par.remove_stars_early.val && !par.use_starxterminator.val) {
                  // If we remove stars with starnet we need to stretch before
                  // star removal
                  var mapping_on_nonlinear_data = true;
            } else {
                  var mapping_on_nonlinear_data = par.mapping_on_nonlinear_data.val;
            }

            if (!mapping_on_nonlinear_data) {
                  /* We run PixelMath using linear images. 
                   */
                  addProcessingStep("Custom mapping, linear narrowband images");
                  RBGmapping.stretched = false;
            } else {
                  /* Stretch images to non-linear before combining with PixelMath.
                   */
                  addProcessingStep("Custom mapping, stretched narrowband images");
                  for (var i = 0; i < images.length; i++) {
                        runHistogramTransform(findWindow(images[i]), null, false, 'RGB');
                  }
                  RBGmapping.stretched = true;
            }
            if (par.remove_stars_early.val) {
                  addProcessingStep("Custom mapping, remove stars");
                  for (var i = 0; i < images.length; i++) {
                        removeStars(findWindow(images[i]), !mapping_on_nonlinear_data);
                  }
            }
            if (par.narrowband_linear_fit.val != "None") {
                  /* Do a linear fit of images before PixelMath. We do this on both cases,
                  * linear and stretched.
                  */
                  var refimage = findLinearFitHSOMapRefimage(images, par.narrowband_linear_fit.val);
                  linearFitArray(refimage, images);
            }

            /* Run PixelMath to create a combined RGB image.
             */
            RGB_win_id = runPixelMathRGBMapping(ppar.win_prefix + "Integration_RGB", null, red_mapping, green_mapping, blue_mapping);

            RGB_win = findWindow(RGB_win_id);
            RGB_win.show();
            addScriptWindow(RGB_win_id);

      } else {
            // We have both RGB and narrowband, do custom mapping on individual channels.
            // Here we just create different combined channels in linear format and
            // then continue as normal RGB processing.
            // If we have multiple images in mapping we use linear fit to match
            // them before PixelMath.
            addProcessingStep("RGB and narrowband mapping, create LRGB channel images and continue with RGB workflow");
            if (is_luminance_images) {
                  var L_images = [];
                  var luminance_mapping = mapCustomAndReplaceImageNames('L', L_images, null);
                  luminance_id = mapRGBchannel(L_images, ppar.win_prefix + "Integration_L", luminance_mapping);
            }

            red_id = mapRGBchannel(R_images, ppar.win_prefix + "Integration_R", red_mapping);
            green_id = mapRGBchannel(G_images, ppar.win_prefix + "Integration_G", green_mapping);
            blue_id = mapRGBchannel(B_images, ppar.win_prefix + "Integration_B", blue_mapping);
            
            RBGmapping.combined = false;
            RBGmapping.stretched = false;
      }

      return RBGmapping;
}

function isCustomMapping(narrowband)
{
      return narrowband && !par.use_RGBNB_Mapping.val;
}

// copy id to _map name if id not null
function copyToMapIf(id)
{
      if (id != null) {
            var new_id = ensure_win_prefix(id + "_map");
            copyWindow(findWindow(id), new_id);
            return new_id;
      } else {
            return id;
      }
}

/* Map RGB channels. We do PixelMath mapping here if we have narrowband images.
 */
function mapLRGBchannels()
{
      var RBGmapping = { combined: false, stretched: false};

      var rgb = R_id != null || G_id != null || B_id != null;
      narrowband = H_id != null || S_id != null || O_id != null;
      var custom_mapping = isCustomMapping(narrowband);

      if (rgb && narrowband) {
            addProcessingStep("There are both RGB and narrowband data, processing as RGB image");
            narrowband = false;
      }
      if (narrowband) {
            addProcessingStep("Processing as narrowband image");
      }

      addProcessingStep("Map LRGB channels");

      if (custom_mapping) {
            addProcessingStep("Narrowband files, use custom mapping");
            RBGmapping = customMapping(null);
      } else {
            addProcessingStep("Normal RGB processing");
            /* Make a copy of original windows. */
            if (luminance_id == null) {
                  // We may already have copied L_id so we do it
                  // here only if it is not copied yet.
                  luminance_id = copyToMapIf(L_id);
            }
            red_id = copyToMapIf(R_id);
            green_id = copyToMapIf(G_id);
            blue_id = copyToMapIf(B_id);
      }
      return RBGmapping;
}

// add as a first item, first item should be the best image
function insert_image_for_integrate(images, new_image)
{
      images.unshift(new Array(2));
      images[0][0] = true;                // enabled
      images[0][1] = new_image;           // path
}

// add to the end
function append_image_for_integrate(images, new_image)
{
      console.writeln("append_image_for_integrate " + new_image);
      var len = images.length;
      images[len] = [];
      images[len][0] = true;
      images[len][1] = new_image;
}

/* After SubframeSelector run StarAlignment on *_a.xisf files.
   The output will be *_a_r.xisf files.
*/
function runStarAlignment(imagetable, refImage)
{
      var alignedFiles;

      addProcessingStep("Star alignment on " + imagetable.length + " files, reference image " + refImage);
      console.writeln("input[0] " + imagetable[0]);

      var targets = [];

      for (var i = 0; i < imagetable.length; i++) {
            targets[targets.length] = [ true, true, imagetable[i] ];
      }

      var P = new StarAlignment;
      if (par.strict_StarAlign.val) {
            P.structureLayers = 5;
            P.noiseReductionFilterRadius = 0;
            P.sensitivity = 0.100;
            P.ransacTolerance = 2.00;
            P.ransacMaxIterations = 2000;
      } else {
            P.structureLayers = 6;
            P.noiseReductionFilterRadius = 5;
            P.sensitivity = 0.010;
            P.ransacTolerance = 6.00;
            P.ransacMaxIterations = 3000;
      }
      if (par.use_drizzle.val) {
            P.generateDrizzleData = true; /* Generate .xdrz files. */
      } else {
            P.generateDrizzleData = false;
      }
      P.splineSmoothness = 0.25;    // default 0.050
      P.outputDirectory = outputRootDir + AutoOutputDir;
      P.referenceImage = refImage;
      P.referenceIsFile = true;
      P.targets = targets;
      P.overwriteExistingFiles = true;

      P.executeGlobal();

      alignedFiles = fileNamesFromOutputData(P.outputData);

      addProcessingStep("runStarAlignment, " + alignedFiles.length + " files");
      console.writeln("output[0] " + alignedFiles[0]);

      return alignedFiles;
}

function runLocalNormalization(imagetable, refImage)
{
      addProcessingStep("Run local normalization using reference image " + refImage);

      if (imagetable.length == 0) {
            // No new files are needed
            addProcessingStep("No files for local normalization");
            return;
      }

      var targets = [];

      for (var i = 0; i < imagetable.length; i++) {
            var add_file = true;
            if (imagetable.length <= 3) {
                  // we may have duplicates, filter them out
                  for (j = 0; j < targets.length; j++) {
                        if (targets[j][1] == imagetable[i][1]) {
                              console.writeln("runLocalNormalization, remove duplicate " +imagetable[i][1]);
                              add_file = false;
                              break;
                        }
                  }
            }
            if (add_file && par.start_from_imageintegration.val) {
                  // If we are starting from image integration then we
                  // use existing .xnml files.
                  var xnml_file = imagetable[i][1].replace(".xisf", ".xnml");
                  if (File.exists(xnml_file)) {
                        add_file = false;
                  }
            }
            if (add_file) {
                  targets[targets.length] = [ true, imagetable[i][1] ];
            }
      }
      if (targets.length == 0) {
            // No new files are needed
            addProcessingStep("Using existing local normalization files");
            return;
      }
      var P = new LocalNormalization;
      P.referencePathOrViewId = refImage;
      P.targetItems = targets;            // [ enabled, image ]
      if (par.start_from_imageintegration.val) {
            // We assume we are processing *_r.xisf files from
            // outputRootDir + AutoOutputDir directory so we write
            // output to the same directory.
            P.outputDirectory = outputRootDir;
      } else {
            P.outputDirectory = outputRootDir + AutoOutputDir;
      }
      P.overwriteExistingFiles = true;

      P.executeGlobal();
}

function runLinearFit(refViewId, targetId)
{
      addProcessingStep("Run linear fit on " + targetId + " using " + refViewId + " as reference");
      if (refViewId == null || targetId == null) {
            throwFatalError("No image for linear fit, maybe some previous step like star alignment failed");
      }
      linear_fit_done = true;
      var targetWin = ImageWindow.windowById(targetId);
      var P = new LinearFit;
      P.referenceViewId = refViewId;

      targetWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(targetWin.mainView);
      targetWin.mainView.endProcess();
}

function runDrizzleIntegration(images, name, local_normalization)
{
      addProcessingStep("run DrizzleIntegration");

      var drizzleImages = [];
      for (var i = 0; i < images.length; i++) {
            drizzleImages[i] = [];
            drizzleImages[i][0] = images[i][0];                                 // enabled
            drizzleImages[i][1] = images[i][1].replace(".xisf", ".xdrz");       // drizzlePath
            if (local_normalization) {
                  drizzleImages[i][2] = images[i][1].replace(".xisf", ".xnml"); // localNormalizationDataPath
            } else {
                  drizzleImages[i][2] = "";                                     // localNormalizationDataPath
            }
      }

      var P = new DrizzleIntegration;
      P.inputData = drizzleImages; // [ enabled, path, localNormalizationDataPath ]
      P.enableLocalNormalization = local_normalization;

      P.executeGlobal();

      windowCloseif(P.weightImageId);

      var new_name = windowRename(P.integrationImageId, ppar.win_prefix + "Integration_" + name);
      //addScriptWindow(new_name);
      return new_name;
}

function getRejectionAlgorigthm(numimages)
{
      if (numimages < 8) {
            addProcessingStep("  Using Percentile clip for rejection because number of images is " + numimages);
            return ImageIntegration.prototype.PercentileClip;
      }
      if (par.use_clipping.val == 'Percentile') {
            addProcessingStep("  Using Percentile clip for rejection");
            return ImageIntegration.prototype.PercentileClip;
      } else if (par.use_clipping.val == 'Sigma') {
            addProcessingStep("  Using Sigma clip for rejection");
            return ImageIntegration.prototype.SigmaClip;
      } else if (par.use_clipping.val == 'Winsorised sigma') {
            addProcessingStep("  Using Winsorised sigma clip for rejection");
            return ImageIntegration.prototype.WinsorizedSigmaClip;
      } else if (par.use_clipping.val == 'Averaged sigma') {
            addProcessingStep("  Using Averaged sigma clip for rejection");
            return ImageIntegration.prototype.AveragedSigmaClip;
      } else if (par.use_clipping.val == 'Linear fit') {
            addProcessingStep("  Using Linear fit clip for rejection");
            return ImageIntegration.prototype.LinearFit;
      } else if (par.use_clipping.val == 'EDS') {
            addProcessingStep("  Using EDS clip for rejection");
            return ImageIntegration.prototype.Rejection_ESD;
      } else if (par.use_clipping.val == 'Auto2') {
            /* In theory these should be good choices but sometime give much more uneven
             * highlights than Sigma.
             */
            if (numimages < 8) {
                  addProcessingStep("  Auto2 using percentile clip for rejection");
                  return ImageIntegration.prototype.PercentileClip;
            } else if (numimages <= 10) {
                  addProcessingStep("  Auto2 using Averaged sigma clip for rejection");
                  return ImageIntegration.prototype.AveragedSigmaClip;
            } else if (numimages < 20) {
                  addProcessingStep("  Auto2 using Winsorised sigma clip for rejection");
                  return ImageIntegration.prototype.WinsorizedSigmaClip;
            } else if (numimages < 25 || ImageIntegration.prototype.Rejection_ESD === undefined) {
                  addProcessingStep("  Auto2 using linear fit clip for rejection");
                  return ImageIntegration.prototype.LinearFit;
            } else {
                  addProcessingStep("  Auto2 using ESD clip for rejection");
                  return ImageIntegration.prototype.Rejection_ESD;
            }
      } else {
            /* par.use_clipping.val == 'Auto1' */
            if (numimages < 8) {
                  addProcessingStep("  Auto1 using percentile clip for rejection");
                  return ImageIntegration.prototype.PercentileClip;
            } else {
                  addProcessingStep("  Auto1 using Sigma clip for rejection");
                  return ImageIntegration.prototype.SigmaClip;
            }
      }
}

function ensureThreeImages(images)
{
      if (images.length == 1) {
            // Add existing image twice so we have three images
            append_image_for_integrate(images, images[0][1]);
            append_image_for_integrate(images, images[0][1]);
      } else if (images.length == 2) {
            // Duplicate both images so averages are not affected
            append_image_for_integrate(images, images[0][1]);
            append_image_for_integrate(images, images[1][1]);
      }
}

function runImageIntegrationEx(images, name, local_normalization)
{
      var P = new ImageIntegration;

      P.images = images; // [ enabled, path, drizzlePath, localNormalizationDataPath ]
      if (ssweight_set && par.use_imageintegration_ssweight.val) {
            addProcessingStep("  Using SSWEIGHT for ImageIntegration weightMode");
            P.weightMode = ImageIntegration.prototype.KeywordWeight;
            P.weightKeyword = "SSWEIGHT";
      }
      if (local_normalization) {
            addProcessingStep("  Using LocalNormalization for ImageIntegration normalization");
            P.normalization = ImageIntegration.prototype.LocalNormalization;
      } else if (par.imageintegration_normalization.val == 'Additive') {
            addProcessingStep("  Using AdditiveWithScaling for ImageIntegration normalization");
            P.normalization = ImageIntegration.prototype.AdditiveWithScaling;
      } else if (par.imageintegration_normalization.val == 'Adaptive') {
            addProcessingStep("  Using AdaptiveNormalization for ImageIntegration normalization");
            P.normalization = ImageIntegration.prototype.AdaptiveNormalization;
      } else {
            addProcessingStep("  Using NoNormalization for ImageIntegration normalization");
            P.normalization = ImageIntegration.prototype.NoNormalization;
      }
      if (name == 'LDD') {
            // Integration for LDDEngine, do not use rejection
            P.rejection = ImageIntegration.prototype.NoRejection;
      } else {
            P.rejection = getRejectionAlgorigthm(images.length);
      }
      if (local_normalization) {
            P.rejectionNormalization = ImageIntegration.prototype.LocalRejectionNormalization;
      } else if (0 && par.imageintegration_normalization.val == 'Adaptive') {
            // Using AdaptiveRejectionNormalization seem to abort ImageIntegration with bad data sets
            P.rejectionNormalization = ImageIntegration.prototype.AdaptiveRejectionNormalization;
      } else {
            P.rejectionNormalization = ImageIntegration.prototype.Scale;
      }
      P.clipLow = !par.skip_imageintegration_clipping.val;            // def: true
      P.clipHigh = !par.skip_imageintegration_clipping.val;           // def: true
      P.rangeClipLow = !par.skip_imageintegration_clipping.val;       // def: true
      if (name == 'LDD') {
            P.generateDrizzleData = false;
      } else {
            P.generateDrizzleData = par.use_drizzle.val || par.generate_xdrz.val;
      }
      P.evaluateNoise = true;

      P.executeGlobal();

      windowCloseif(P.highRejectionMapImageId);
      windowCloseif(P.lowRejectionMapImageId);
      windowCloseif(P.slopeMapImageId);

      if (par.use_drizzle.val && name != 'LDD') {
            windowCloseif(P.integrationImageId);
            return runDrizzleIntegration(images, name, local_normalization);
      } else {
            var new_name = windowRename(P.integrationImageId, ppar.win_prefix + "Integration_" + name);
            return new_name
      }
}

function runImageIntegrationNormalized(images, best_image, name)
{
      addProcessingStep("ImageIntegration with LocalNormalization");

      runLocalNormalization(images, best_image);

      console.writeln("Using local normalized data in image integration");
      
      var norm_images = [];
      for (var i = 0; i < images.length; i++) {
            var oneimage = [];
            oneimage[0] = true;                                   // enabled
            oneimage[1] = images[i][1];                           // path
            if (par.use_drizzle.val) {
                  oneimage[2] = images[i][1].replace(".xisf", ".xdrz"); // drizzlePath
            } else {
                  oneimage[2] = "";                                     // drizzlePath
            }
            oneimage[3] = images[i][1].replace(".xisf", ".xnml");    // localNormalizationDataPath
            norm_images[norm_images.length] = oneimage;
      }
      console.writeln("runImageIntegrationNormalized, " + norm_images[0][1] + ", " + norm_images[0][3]);

      return runImageIntegrationEx(norm_images, name, true);
}

function runImageIntegration(channel_images, name)
{
      var images = channel_images.images;
      if (images == null || images.length == 0) {
            return null;
      }
      addProcessingStep("Image " + name + " integration on " + images.length + " files");

      ensureThreeImages(images);

      if (!par.local_normalization.val || name == 'LDD') {
            if (par.use_drizzle.val) {
                  var drizzleImages = [];
                  for (var i = 0; i < images.length; i++) {
                        drizzleImages[i] = [];
                        drizzleImages[i][0] = images[i][0];      // enabled
                        drizzleImages[i][1] = images[i][1];      // path
                        drizzleImages[i][2] = images[i][1].replace(".xisf", ".xdrz"); // drizzlePath
                  }
                  var integration_images = drizzleImages;
            } else {
                  var integration_images = images;
            }

            return runImageIntegrationEx(integration_images, name, false);

      } else {
            return runImageIntegrationNormalized(images, channel_images.best_image, name);
      }
}


/* Do run ABE so just make copy of the source window as
 * is done by AutomaticBackgroundExtractor.
 */
function noABEcopyWin(win)
{
      var new_win_id = win.mainView.id;
      var fix_postfix = "_map";
      if (new_win_id.endsWith(fix_postfix)) {
            new_win_id = new_win_id.substring(0, new_win_id.length - fix_postfix.length);
      }
      var noABE_id = ensure_win_prefix(new_win_id + "_noABE");
      addProcessingStep("No ABE for " + win.mainView.id);
      addScriptWindow(noABE_id);
      copyWindow(win, noABE_id);
      return noABE_id;
}

function runABEex(win, replaceTarget, postfix)
{
      if (replaceTarget) {
            addProcessingStep("run ABE on image " + win.mainView.id);
            var ABE_id = win.mainView.id;
      } else {
            var ABE_id = ensure_win_prefix(win.mainView.id + postfix);
            addProcessingStep("run ABE from image " + win.mainView.id + ", target image " + ABE_id);
      }

      var P = new AutomaticBackgroundExtractor;
      P.correctedImageId = ABE_id;
      P.replaceTarget = replaceTarget;
      P.discardModel = true;
      P.targetCorrection = AutomaticBackgroundExtractor.prototype.Subtract;

      if (debug) {
            console.writeln(P.toSource());
      }

      win.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(win.mainView, false);

      win.mainView.endProcess();

      addScriptWindow(ABE_id);

      return ABE_id;
}

function runABE(win, replaceTarget)
{
      return runABEex(win, replaceTarget, "_ABE");
}

// Run ABE and rename windows so that the final result has the same id
function run_ABE_before_channel_combination(id)
{
      if (id == null) {
            throwFatalError("No image for ABE, maybe some previous step like star alignment failed");
      }
      var id_win = ImageWindow.windowById(id);
      runABEex(id_win, true, "");
      return id;
}

/*
 * Default STF Parameters
 */

// Shadows clipping point in (normalized) MAD units from the median.
#define DEFAULT_AUTOSTRETCH_SCLIP  -2.80
// Target mean background in the [0,1] range.
#define DEFAULT_AUTOSTRETCH_TBGND   0.25
// Apply the same STF to all nominal channels (true), or treat each channel
// separately (false).
#define DEFAULT_AUTOSTRETCH_CLINK   true

/* ApplyAutoSTF routine is from PixInsight scripts.
 *
 */
function ApplyAutoSTF(view, shadowsClipping, targetBackground, rgbLinked, silent)
{
   if (!silent) {
       console.writeln("  Apply AutoSTF on " + view.id);
   }
   var stf = new ScreenTransferFunction;

   var n = view.image.isColor ? 3 : 1;

   var median = view.computeOrFetchProperty("Median");

   var mad = view.computeOrFetchProperty("MAD");
   mad.mul(1.4826); // coherent with a normal distribution

   if (par.STF_linking.val == 'Linked') {
      rgbLinked = true;  
   } else if (par.STF_linking.val == 'Unlinked') {
      rgbLinked = false;  
   } else {
         // auto, use default
   }
   if (!silent) {
      console.writeln("  RgbLinked " + rgbLinked);
   }

   if (rgbLinked)
   {
      /*
       * Try to find how many channels look as channels of an inverted image.
       * We know a channel has been inverted because the main histogram peak is
       * located over the right-hand half of the histogram. Seems simplistic
       * but this is consistent with astronomical images.
       */
      var invertedChannels = 0;
      for (var c = 0; c < n; ++c)
         if (median.at(c) > 0.5)
            ++invertedChannels;

      if (invertedChannels < n)
      {
         /*
          * Noninverted image
          */
         var c0 = 0, m = 0;
         for (var c = 0; c < n; ++c)
         {
            if (1 + mad.at(c) != 1)
               c0 += median.at(c) + shadowsClipping * mad.at(c);
            m  += median.at(c);
         }
         c0 = Math.range(c0/n, 0.0, 1.0);
         m = Math.mtf(targetBackground, m/n - c0);

         stf.STF = [ // c0, c1, m, r0, r1
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [c0, 1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
      else
      {
         /*
          * Inverted image
          */
         var c1 = 0, m = 0;
         for (var c = 0; c < n; ++c)
         {
            m  += median.at(c);
            if (1 + mad.at(c) != 1)
               c1 += median.at(c) - shadowsClipping * mad.at(c);
            else
               c1 += 1;
         }
         c1 = Math.range(c1/n, 0.0, 1.0);
         m = Math.mtf(c1 - m/n, targetBackground);

         stf.STF = [ // c0, c1, m, r0, r1
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, c1, m, 0, 1],
                     [0, 1, 0.5, 0, 1] ];
      }
   }
   else
   {
      /*
       * Unlinked RGB channels: Compute automatic stretch functions for
       * individual RGB channels separately.
       */
      var A = [ // c0, c1, m, r0, r1
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1],
               [0, 1, 0.5, 0, 1] ];

      for (var c = 0; c < n; ++c)
      {
         if (median.at(c) < 0.5)
         {
            /*
             * Noninverted channel
             */
            var c0 = (1 + mad.at(c) != 1) ? Math.range(median.at(c) + shadowsClipping * mad.at(c), 0.0, 1.0) : 0.0;
            var m  = Math.mtf(targetBackground, median.at(c) - c0);
            A[c] = [c0, 1, m, 0, 1];
         }
         else
         {
            /*
             * Inverted channel
             */
            var c1 = (1 + mad.at(c) != 1) ? Math.range(median.at(c) - shadowsClipping * mad.at(c), 0.0, 1.0) : 1.0;
            var m  = Math.mtf(c1 - median.at(c), targetBackground);
            A[c] = [0, c1, m, 0, 1];
         }
      }

      stf.STF = A;
   }

   if (!silent) {
      console.writeln("<end><cbr/><br/><b>", view.fullId, "</b>:");
      for (var c = 0; c < n; ++c)
      {
            console.writeln("channel #", c);
            console.writeln(format("c0 = %.6f", stf.STF[c][0]));
            console.writeln(format("m  = %.6f", stf.STF[c][2]));
            console.writeln(format("c1 = %.6f", stf.STF[c][1]));
      }
   }
   view.beginProcess(UndoFlag_NoSwapFile);

   stf.executeOn(view);

   view.endProcess();

   if (!silent) {
      console.writeln("<end><cbr/><br/>");
   }
}

/* applySTF routine is from PixInsight scripts.
 */
function applySTF(imgView, stf, iscolor)
{
      console.writeln("  Apply STF on " + imgView.id);
      var HT = new HistogramTransformation;

      if (iscolor) {
            HT.H = [	// shadows, midtones, highlights, rescale0, rescale1
                        [stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]],    // red
                        [stf[1][1], stf[1][0], stf[1][2], stf[1][3], stf[1][4]],    // green
                        [stf[2][1], stf[2][0], stf[2][2], stf[2][3], stf[2][4]],    // blue
                        [ 0, 0.5, 1, 0, 1]
                  ];
      } else {
            HT.H = [
                        [ 0, 0.5, 1, 0, 1],
                        [ 0, 0.5, 1, 0, 1],
                        [ 0, 0.5, 1, 0, 1],
                        [stf[0][1], stf[0][0], stf[0][2], stf[0][3], stf[0][4]]     // luminance
                  ];
      }

      imgView.beginProcess(UndoFlag_NoSwapFile);

      HT.executeOn(imgView, false);

      imgView.endProcess();
}

function runHistogramTransformSTFex(ABE_win, stf_to_use, iscolor, targetBackground, silent)
{
      if (!silent) {
            addProcessingStep("Run histogram transform on " + ABE_win.mainView.id + " based on autostretch");
      }

      if (stf_to_use == null) {
            /* Apply autostretch on image */
            var rgbLinked = true;
            if (narrowband) {
                  if (linear_fit_done) {
                        rgbLinked = true;
                  } else {
                        rgbLinked = false;
                  }
            } else if (iscolor) {
                  rgbLinked = false;
            }
            ApplyAutoSTF(ABE_win.mainView,
                        DEFAULT_AUTOSTRETCH_SCLIP,
                        targetBackground,
                        rgbLinked,
                        silent);
            stf_to_use = ABE_win.mainView.stf;
      }

      /* Run histogram transfer function based on autostretch */
      applySTF(ABE_win.mainView, stf_to_use, iscolor);

      /* Undo autostretch */
      if (!silent) {
            console.writeln("  Undo STF on " + ABE_win.mainView.id);
      }
      var stf = new ScreenTransferFunction;

      ABE_win.mainView.beginProcess(UndoFlag_NoSwapFile);

      if (!silent) {
            console.writeln(" Execute autostretch on " + ABE_win.mainView.id);
      }
      stf.executeOn(ABE_win.mainView);

      ABE_win.mainView.endProcess();

      return stf_to_use;
}

function runHistogramTransformSTF(ABE_win, stf_to_use, iscolor, targetBackground)
{
      return runHistogramTransformSTFex(ABE_win, stf_to_use, iscolor, targetBackground, false);
}

function runHistogramTransformMaskedStretch(ABE_win)
{
      addProcessingStep("Run histogram transform on " + ABE_win.mainView.id + " using MaskedStretch");

      var P = new MaskedStretch;
      P.targetBackground = par.MaskedStretch_targetBackground.val;

      ABE_win.mainView.beginProcess(UndoFlag_NoSwapFile);

      console.writeln("Execute MaskedStretch on " + ABE_win.mainView.id);
      P.executeOn(ABE_win.mainView);

      ABE_win.mainView.endProcess();
}

function runHistogramTransformHyperbolic(ABE_win)
{
      var P = new PixelMath;
      P.expression = "iif(b==0,EC=1,EC=0);\n" +
      "iif(b>0,Ds=D*b,Ds=D);\n" +
      "iif(b>0,bs=b,bs=1);\n" +
      "iif(EC==1,q0=exp(-Ds*SP),q0=(1+Ds*SP)^(-1/bs));\n" +
      "iif(EC==1,qWP=2-exp(-Ds*(HP-SP)),qWP=2-(1+Ds*(HP-SP))^(-1/bs));\n" +
      "iif(EC==1,q1=2-2*exp(-Ds*(HP-SP))+exp(-Ds*(2*HP-SP-1)),q1=2-2*(1+Ds*(HP-SP))^(-1/bs)+(1+Ds*(2*HP-SP-1))^(-1/bs));\n" +
      "iif($T<SP,EC*exp(-Ds*(SP-$T))+(1-EC)*(1+Ds*(SP-$T))^(-1/bs)-q0,iif($T>HP,2-EC*(2*exp(-Ds*(HP-SP))+exp(-Ds*(2*HP-$T-SP)))+(1-EC)*(2*(1+Ds*(HP-SP))^(-1/bs)+(1+Ds*(2*HP-$T-SP))^(-1/bs))-q0,2-EC*exp(-Ds*($T-SP))-(1-EC)*(1+Ds*($T-SP))^(-1/bs)-q0))/(q1-q0);";
      P.expression1 = "";
      P.expression2 = "";
      P.expression3 = "";
      P.useSingleExpression = true;
      P.symbols = "D = " + par.Hyperbolic_D.val + ";\n" +
      "b = " + par.Hyperbolic_b.val + ";\n" +
      "SP =0.00;\n" +
      "HP =1.00;\n" +
      "Rnorm;\n" +
      "q0;\n" +
      "qWP;\n" +
      "q1;\n" +
      "Ds;\n" +
      "bs;\n" +
      "EC;";
      P.clearImageCacheAndExit = false;
      P.cacheGeneratedImages = false;
      P.generateOutput = true;
      P.singleThreaded = false;
      P.optimization = true;
      P.use64BitWorkingImage = false;
      P.rescale = false;
      P.rescaleLower = 0;
      P.rescaleUpper = 1;
      P.truncate = true;
      P.truncateLower = 0;
      P.truncateUpper = 1;
      P.createNewImage = false;
      P.showNewImage = true;
      P.newImageId = "";
      P.newImageWidth = 0;
      P.newImageHeight = 0;
      P.newImageAlpha = false;
      P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
      P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

      addProcessingStep("Run histogram transform on " + ABE_win.mainView.id + " using Generalized Hyperbolic Stretching");
      console.writeln("Symbols " + P.symbols);

      ABE_win.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(ABE_win.mainView);

      ABE_win.mainView.endProcess();
}

function runHistogramTransform(ABE_win, stf_to_use, iscolor, type)
{
      if (!run_HT) {
            addProcessingStep("Do not run histogram transform on " + ABE_win.mainView.id);
            return null;
      }

      if (par.image_stretching.val == 'Auto STF' 
          || type == 'mask'
          || type == 'extra'
          || (par.image_stretching.val == 'Use both' && type == 'L'))
      {
            if (type == 'mask') {
                  targetBackground = DEFAULT_AUTOSTRETCH_TBGND;
            } else {
                  targetBackground = par.STF_targetBackground.val;
            }
            return runHistogramTransformSTF(ABE_win, stf_to_use, iscolor, targetBackground);

      } else if (par.image_stretching.val == 'Masked Stretch'
                 || (par.image_stretching.val == 'Use both' && type == 'RGB'))
      {
            runHistogramTransformMaskedStretch(ABE_win);
            return null;

      } else if (par.image_stretching.val == 'Hyperbolic') {
            for (var i = 0; i < par.Hyperbolic_iterations.val; i++) {
                  runHistogramTransformHyperbolic(ABE_win);
            }
            return null;
            
      } else {
            throwFatalError("Bad image stretching value " + par.image_stretching.val + " with type " + type);
            return null;
      }
}

function runACDNRReduceNoise(imgWin, maskWin)
{
      if (par.ACDNR_noise_reduction.val == 0.0) {
            return;
      }
      addProcessingStep("ACDNR noise reduction on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new ACDNR;
      P.applyToChrominance = false;
      P.sigmaL = par.ACDNR_noise_reduction.val;
      P.amountL = 0.50;

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      if (maskWin != null) {
            /* Remove noise from dark parts of the image. */
            imgWin.setMask(maskWin);
            imgWin.maskInverted = true;
      }

      P.executeOn(imgWin.mainView, false);

      if (maskWin != null) {
            imgWin.removeMask();
      }

      imgWin.mainView.endProcess();
}

function noiseSuperStrong()
{
      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, true, 4.000, 0.70, 3],
            [true, true, 0.000, true, 3.000, 0.60, 3],
            [true, true, 0.000, true, 2.000, 0.60, 2],
            [true, true, 0.000, true, 1.000, 0.50, 1],
            [true, true, 0.000, true, 0.500, 0.50, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];

      return P;
}

function noiseStronger()
{
      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, true, 5.000, 0.50, 3],
            [true, true, 0.000, true, 3.000, 0.50, 3],
            [true, true, 0.000, true, 2.000, 0.50, 2],
            [true, true, 0.000, true, 1.000, 0.50, 1],
            [true, true, 0.000, true, 0.500, 0.50, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];
      
      return P;
}

function noiseStrong()
{
      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, true, 4.000, 0.50, 3],
            [true, true, 0.000, true, 2.000, 0.50, 2],
            [true, true, 0.000, true, 1.000, 0.50, 2],
            [true, true, 0.000, true, 0.500, 0.50, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];

      return P;
}

function noiseMild()
{
      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, true, 3.000, 0.50, 3],
            [true, true, 0.000, true, 1.000, 0.50, 1],
            [true, true, 0.000, true, 0.500, 0.50, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];

      return P;
}

function noiseVeryMild()
{
      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, true, 1.000, 0.50, 2],
            [true, true, 0.000, true, 0.500, 0.50, 2],
            [true, true, 0.000, true, 0.500, 0.50, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];

      return P;
}

function runMultiscaleLinearTransformReduceNoise(imgWin, maskWin, strength)
{
      if (strength == 0) {
            return;
      }

      console.writeln("runMultiscaleLinearTransformReduceNoise on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id + ", strength " + strength);

      switch (strength) {
            case 2:
                  var P = noiseVeryMild();
                  break;
            case 3:
                  var P = noiseMild();
                  break;
            case 4:
                  var P = noiseStrong();
                  break;
            case 5:
                  var P = noiseStronger();
                  break;
            case 6:
                  var P = noiseSuperStrong();
                  break;
            default:
                  throwFatalError("Bad noise reduction value " + strength);
      } 

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      if (maskWin != null) {
            /* Remove noise from dark parts of the image. */
            imgWin.setMask(maskWin);
            imgWin.maskInverted = true;
      }

      P.executeOn(imgWin.mainView, false);

      if (maskWin != null) {
            imgWin.removeMask();
      }

      imgWin.mainView.endProcess();
}

function runNoiseReduction(imgWin, maskWin)
{
      if (par.skip_noise_reduction.val || par.noise_reduction_strength.val == 0) {
            return;
      }

      addProcessingStep("Noise reduction on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      runMultiscaleLinearTransformReduceNoise(imgWin, maskWin, par.noise_reduction_strength.val);
}
function runColorReduceNoise(imgWin)
{
      if (!par.use_color_noise_reduction.val) {
            return;
      }
      addProcessingStep("Color noise reduction on " + imgWin.mainView.id);

      var P = new TGVDenoise;
      P.rgbkMode = false;
      P.filterEnabledL = false;
      P.filterEnabledC = true;
      P.supportEnabled = true;

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Remove color noise from the whole image. */
      P.executeOn(imgWin.mainView, false);

      imgWin.mainView.endProcess();
}

function runBackgroundNeutralization(imgView)
{
      addProcessingStep("Background neutralization on " + imgView.id);

      var P = new BackgroundNeutralization;

      imgView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(imgView, false);

      imgView.endProcess();
}

function runColorCalibration(imgView)
{
      if (narrowband) {
            addProcessingStep("No color calibration for narrowband");
            return;
      }
      if (par.skip_color_calibration.val) {
            addProcessingStep("No color calibration was selected");
            return;
      }
      try {
            addProcessingStep("Color calibration on " + imgView.id);

            var P = new ColorCalibration;

            imgView.beginProcess(UndoFlag_NoSwapFile);

            P.executeOn(imgView, false);

            imgView.endProcess();
      } catch(err) {
            console.criticalln("Color calibration failed");
            console.criticalln(err);
            addProcessingStep("Maybe filter files or file format were not recognized correctly");
            throwFatalError("Color calibration failed");
      }
}

function runColorSaturation(imgWin, maskWin)
{
      addProcessingStep("Color saturation on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);
      var P = new ColorSaturation;
      P.HS = [ // x, y
            [0.00000, 0.43636],
            [0.12661, -0.10909],
            [0.27390, -0.63636],
            [0.42377, -0.74545],
            [0.52196, -0.32727],
            [0.63566, 0.56364],
            [0.76744, 1.29091],
            [1.00000, 0.76364]
      ];


      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Saturate only light parts of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = false;
      
      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function runCurvesTransformationSaturation(imgWin, maskWin)
{
      addProcessingStep("Curves transformation for saturation on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new CurvesTransformation;
      P.S = [ // x, y
            [0.00000, 0.00000],
            [0.68734, 0.83204],
            [1.00000, 1.00000]
      ];

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Saturate only light parts of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = false;
      
      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function increaseSaturation(imgWin, maskWin)
{
      //runColorSaturation(imgWin, maskWin);
      runCurvesTransformationSaturation(imgWin, maskWin);
}

function runLRGBCombination(RGB_id, L_id)
{
      var targetWin = copyWindow(
                        ImageWindow.windowById(RGB_id), 
                        ensure_win_prefix(RGB_id.replace("RGB", "LRGB")));
      var RGBimgView = targetWin.mainView;
      addProcessingStep("LRGB combination of " + RGB_id + " and luminance image " + L_id + " into " + RGBimgView.id);
      var P = new LRGBCombination;
      P.channels = [ // enabled, id, k
            [false, "", 1.00000],
            [false, "", 1.00000],
            [false, "", 1.00000],
            [true, L_id, 1.00000]
      ];
      P.mL = par.LRGBCombination_lightness.val;
      P.mc = par.LRGBCombination_saturation.val;
      P.noiseReduction = true;

      RGBimgView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(RGBimgView, false);

      RGBimgView.endProcess();

      return RGBimgView.id;
}

function runSCNR(RGBimgView, fixing_stars)
{
      if (!fixing_stars) {
            addProcessingStep("SCNR on " + RGBimgView.id);
      }
      var P = new SCNR;
      if (narrowband && par.leave_some_green.val && !fixing_stars) {
            P.amount = 0.50;
            addProcessingStep("Run SCNR using amount " + P.amount + " to leave some green color");
      } else {
            P.amount = 1.00;
      }

      RGBimgView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(RGBimgView, false);

      RGBimgView.endProcess();
}

// Run hue shift on narrowband image to enhance orange.
function narrowbandHueShift(imgView)
{
      addProcessingStep("Hue shift on " + imgView.id);
      
      var P = new CurvesTransformation;
      P.H = [ // x, y
         [0.00000, 0.00000],
         [0.30361, 0.18576],
         [0.47454, 0.47348],
         [1.00000, 1.00000]
      ];
      
      imgView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(imgView, false);

      imgView.endProcess();
}

function runMultiscaleLinearTransformSharpen(imgWin, maskWin)
{
      if (par.skip_sharpening.val) {
            console.writeln("No sharpening on " + imgWin.mainView.id);
            return;
      }
      addProcessingStep("Sharpening on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new MultiscaleLinearTransform;
      P.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionIterations
            [true, true, 0.000, false, 3.000, 1.00, 1],
            [true, true, 0.050, false, 3.000, 1.00, 1],
            [true, true, 0.075, false, 3.000, 1.00, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1],
            [true, true, 0.000, false, 3.000, 1.00, 1]
      ];
      P.deringing = true;
      P.deringingDark = 0.1000;     // old value -> 1.24: 0.0100
      P.toChrominance = false;
      
      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Sharpen only light parts of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = false;

      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function getOptionalUniqueFilenamePart()
{
      if (par.unique_file_names.val) {
            return format( "_%04d%02d%02d_%02d%02d%02d",
                        processingDate.getFullYear(), processingDate.getMonth() + 1, processingDate.getDate(),
                        processingDate.getHours(), processingDate.getMinutes(), processingDate.getSeconds());
      } else {
            return "";
      }
}

function ensureDialogFilePath(names)
{
      if (outputRootDir == "") {
            var gdd = new GetDirectoryDialog;
            gdd.caption = "Select Save Directory for " + names;
            console.noteln(gdd.caption);
            if (!gdd.execute()) {
                  console.writeln("No path for " + names + ', nothing written');
                  return false;
            }
            outputRootDir = gdd.directory;
            if (outputRootDir != "") {
                  outputRootDir = ensurePathEndSlash(outputRootDir);
            }
            console.writeln("ensureDialogFilePath, set outputRootDir ", outputRootDir);
            return true;
      } else {
            return true;
      }
}

function writeProcessingSteps(alignedFiles, autocontinue, basename)
{
      if (basename == null) {
            if (autocontinue) {
                  basename = "AutoContinue";
            } else {
                  basename = "AutoIntegrate";
            }
      }
      logfname = basename + getOptionalUniqueFilenamePart() + ".log";
      if (par.win_prefix_to_log_files.val) {
            logfname = ppar.win_prefix + logfname;
      }

      if (!write_processing_log_file) {
            console.writeln(basename + " log file not written.");
            return;
      }

      if (!ensureDialogFilePath(basename + ".log")) {
            return;
      }

      var processedPath = combinePath(outputRootDir, AutoProcessedDir);
      processedPath = ensurePathEndSlash(processedPath);

      console.writeln("Write processing steps to " + processedPath + logfname);

      var file = new File();
      file.createForWriting(processedPath + logfname);

      file.write(console.endLog());
      file.outTextLn("======================================");
      if (lightFileNames != null) {
            file.outTextLn("Dialog files:");
            for (var i = 0; i < lightFileNames.length; i++) {
                  file.outTextLn(lightFileNames[i]);
            }
      }
      if (alignedFiles != null) {
            file.outTextLn("Aligned files:");
            for (var i = 0; i < alignedFiles.length; i++) {
                  file.outTextLn(alignedFiles[i]);
            }
      }
      file.outTextLn(processing_steps);
      file.close();
}

// Find window and optionally search without a prefix
function findWindowCheckBaseNameIf(id, check_base_name)
{
      var win = findWindow(ppar.win_prefix + id);
      if (win == null && check_base_name && ppar.win_prefix != "") {
            // Try to find without prefix so we can autocontinue
            // from default run but will have new output
            // file names.
            win = findWindow(id);
      }
      return win;
}

// Find window id and optionally search without a prefix
function findWindowIdCheckBaseNameIf(name, check_base_name)
{
      var id = findWindowId(ppar.win_prefix + name);
      if (id == null && check_base_name && ppar.win_prefix != "") {
            // Try to find without prefix so we can autocontinue
            // from default run but will have new output
            // file names.
            id = findWindowId(name);
      }
      return id;
}

// Find window with a prefix. If not found and check_base is true
// then try without prefix
function findWindowNoPrefixIf(id, check_base)
{
      var win = findWindow(id);
      if (win == null && check_base && ppar.win_prefix != '' && id.startsWith(ppar.win_prefix)) {
            // Try without prefix
            var win = findWindow(id.substring(ppar.win_prefix.length));
      }
      return win;
}

function findProcessedImages(check_base_name)
{
      L_id = findWindowIdCheckBaseNameIf("Integration_L", check_base_name);
      R_id = findWindowIdCheckBaseNameIf("Integration_R", check_base_name);
      G_id = findWindowIdCheckBaseNameIf("Integration_G", check_base_name);
      B_id = findWindowIdCheckBaseNameIf("Integration_B", check_base_name);
      H_id = findWindowIdCheckBaseNameIf("Integration_H", check_base_name);
      S_id = findWindowIdCheckBaseNameIf("Integration_S", check_base_name);
      O_id = findWindowIdCheckBaseNameIf("Integration_O", check_base_name);
      RGBcolor_id = findWindowIdCheckBaseNameIf("Integration_RGB", check_base_name);
}

function fileNamesFromOutputData(outputFileData)
{
      var newFileNames = [];
      for (var i = 0; i < outputFileData.length; i++) {
            var filePath = outputFileData[i][0];
            if (filePath != null && filePath != "") {
                  newFileNames[newFileNames.length] = filePath;
            }
      }
      return newFileNames;
}

function debayerImages(fileNames)
{
      var succ = true;

      addProcessingStep("debayerImages, fileNames[0] " + fileNames[0]);

      var P = new Debayer;
      P.cfaPattern = debayerPattern_enums[debayerPattern_values.indexOf(par.debayerPattern.val)];
      P.targetItems = filesNamesToEnabledPath(fileNames);
      P.outputDirectory = outputRootDir + AutoOutputDir;
      P.overwriteExistingFiles = true;

      try {
            succ = P.executeGlobal();
      } catch(err) {
            succ = false;
            console.criticalln(err);
      }

      if (!succ) {
            console.criticalln("Debayer failed");
            addProcessingStep("Error, maybe debayer pattern was not correctly selected");
            throwFatalError("Debayer failed");
      }

      return fileNamesFromOutputData(P.outputFileData);
}

// Extract channels from color/OSC/DSLR files. As a result
// we get a new file list with channel files.
function extractChannels(fileNames)
{
      var newFileNames = [];
      var outputDir = outputRootDir + AutoOutputDir;
      var postfix;
      var outputExtension = ".xisf";
      if (par.extract_channel_mapping.val == 'LRGB') {
            var channel_map = "RGB";
      } else {
            var channel_map = par.extract_channel_mapping.val;
      }

      addProcessingStep("extractChannels, " + par.extract_channel_mapping.val + ", fileNames[0] " + fileNames[0]);
      
      for (var i = 0; i < fileNames.length; i++) {
            // Open source image window from a file
            var imageWindows = ImageWindow.open(fileNames[i]);
            if (imageWindows.length != 1) {
                  throwFatalError("*** extractChannels Error: imageWindows.length: " + imageWindows.length);
            }
            var imageWindow = imageWindows[0];
            if (imageWindow == null) {
                  throwFatalError("*** extractChannels Error: Can't read file: " + fileNames[i]);
            }

            // Extract channels and save each channel to a separate file.
            if (par.extract_channel_mapping.val == 'LRGB') {
                  var targetWindow = extractLchannel(imageWindow);
                  var filePath = generateNewFileName(fileNames[i], outputDir, "_L", outputExtension);
                  setFITSKeyword(targetWindow, "FILTER", "L", "AutoIntegrate extracted channel")
                  // Save window
                  if (!writeImage(filePath, targetWindow)) {
                        throwFatalError("*** extractChannels Error: Can't write output image: " + filePath);
                  }
                  newFileNames[newFileNames.length] = filePath;
                  forceCloseOneWindow(targetWindow);
            }

            var rId = extractRGBchannel(imageWindow.mainView.id, 'R');
            var rWin = findWindow(rId);
            var filePath = generateNewFileName(fileNames[i], outputDir, "_" + channel_map[0], outputExtension);
            setFITSKeyword(rWin, "FILTER", channel_map[0], "AutoIntegrate extracted channel")
            if (!writeImage(filePath, rWin)) {
                  throwFatalError("*** extractChannels Error: Can't write output image: " + filePath);
            }
            newFileNames[newFileNames.length] = filePath;
            forceCloseOneWindow(rWin);

            var gId = extractRGBchannel(imageWindow.mainView.id, 'G');
            var gWin = findWindow(gId);
            var filePath = generateNewFileName(fileNames[i], outputDir, "_" + channel_map[1], outputExtension);
            setFITSKeyword(gWin, "FILTER", channel_map[1], "AutoIntegrate extracted channel")
            if (!writeImage(filePath, gWin)) {
                  throwFatalError("*** extractChannels Error: Can't write output image: " + filePath);
            }
            newFileNames[newFileNames.length] = filePath;
            forceCloseOneWindow(gWin);

            var bId = extractRGBchannel(imageWindow.mainView.id, 'B');
            var bWin = findWindow(bId);
            var filePath = generateNewFileName(fileNames[i], outputDir, "_" + channel_map[2], outputExtension);
            setFITSKeyword(bWin, "FILTER", channel_map[2], "AutoIntegrate extracted channel")
            if (!writeImage(filePath, bWin)) {
                  throwFatalError("*** extractChannels Error: Can't write output image: " + filePath);
            }
            newFileNames[newFileNames.length] = filePath;
            forceCloseOneWindow(bWin);

            // Close window
            forceCloseOneWindow(imageWindow);
      }
      return newFileNames;
}

function findStartImages(auto_continue, check_base_name)
{
      /* Check if we have manually done histogram transformation. */
      L_HT_win = findWindowCheckBaseNameIf("L_HT", check_base_name);
      RGB_HT_win = findWindowCheckBaseNameIf("RGB_HT", check_base_name);

      /* Check if we have manual background extracted files. */
      L_BE_win = findWindowCheckBaseNameIf("Integration_L_BE", check_base_name);
      R_BE_win = findWindowCheckBaseNameIf("Integration_R_BE", check_base_name);
      G_BE_win = findWindowCheckBaseNameIf("Integration_G_BE", check_base_name);
      B_BE_win = findWindowCheckBaseNameIf("Integration_B_BE", check_base_name);
      H_BE_win = findWindowCheckBaseNameIf("Integration_H_BE", check_base_name);
      S_BE_win = findWindowCheckBaseNameIf("Integration_S_BE", check_base_name);
      O_BE_win = findWindowCheckBaseNameIf("Integration_O_BE", check_base_name);
      RGB_BE_win = findWindowCheckBaseNameIf("Integration_RGB_BE", check_base_name);

      findProcessedImages(check_base_name);

      if (is_extra_option() || is_narrowband_option()) {
            for (var i = 0; i < final_windows.length; i++) {
                  final_win = findWindowNoPrefixIf(final_windows[i], check_base_name);
                  if (final_win != null) {
                        break;
                  }
            }
      }
      if (L_BE_win != null || L_HT_win != null || L_id != null) {
            is_luminance_images = true;
      } else {
            is_luminance_images = false;
      }

      if (final_win != null) {
            addProcessingStep("Final image " + final_win.mainView.id);
            preprocessed_images = start_images.FINAL;
      } else if (checkAutoCont(L_HT_win) && checkAutoCont(RGB_HT_win)) {      /* L,RGB HistogramTransformation */
            addProcessingStep("L,RGB HistogramTransformation");
            preprocessed_images = start_images.L_RGB_HT;
      } else if (checkAutoCont(RGB_HT_win)) {                                 /* RGB (color) HistogramTransformation */
            addProcessingStep("RGB (color) HistogramTransformation " + RGB_HT_win.mainView.id);
            preprocessed_images = start_images.RGB_HT;
      } else if (checkAutoCont(L_BE_win) && checkAutoCont(RGB_BE_win)) {      /* L,RGB background extracted */
            addProcessingStep("L,RGB background extracted");
            preprocessed_images = start_images.L_RGB_BE;
      } else if (checkAutoCont(RGB_BE_win)) {                                 /* RGB (color) background extracted */
            addProcessingStep("RGB (color) background extracted " + RGB_BE_win.mainView.id);
            preprocessed_images = start_images.RGB_BE;
      } else if ((checkAutoCont(R_BE_win) && checkAutoCont(G_BE_win) && checkAutoCont(B_BE_win)) ||
                  (checkAutoCont(H_BE_win) && checkAutoCont(O_BE_win))) {     /* L,R,G,B background extracted */
            addProcessingStep("L,R,G,B background extracted");
            preprocessed_images = start_images.L_R_G_B_BE;
            narrowband = checkAutoCont(H_BE_win) || checkAutoCont(O_BE_win);
      } else if (RGBcolor_id != null 
                  && H_id == null && O_id == null && L_id == null) {          /* RGB (color) integrated image */
            addProcessingStep("RGB (color) integrated image " + RGBcolor_id);
            var check_name = ppar.win_prefix + "Integration_RGB_ABE";
            if (auto_continue && findWindow(check_name)) {
                  throwFatalError("Cannot start AutoContinue, processed image " + check_name + " already exists. " +
                                    "Close previously processed images or use a different window prefix.")
            }
            var check_name = ppar.win_prefix + "Integration_RGB_noABE";
            if (auto_continue && findWindow(check_name)) {
                  throwFatalError("Cannot start AutoContinue, processed image " + check_name + " already exists. " +
                                    "Close previously processed images or use a different window prefix.")
            }
            checkAutoCont(findWindow(RGBcolor_id));
            preprocessed_images = start_images.RGB_COLOR;
      } else if ((R_id != null && G_id != null && B_id != null) ||
                  (H_id != null && O_id != null)) {                           /* L,R,G,B integrated images */
            addProcessingStep("L,R,G,B integrated images");
            var check_name = ppar.win_prefix + "Integration_RGB";
            if (auto_continue && findWindow(check_name)) {
                  throwFatalError("Cannot start AutoContinue, processed image " + check_name + " already exists. " +
                                    "Close previously processed images or use a different window prefix.")
            }
            checkAutoCont(findWindow(R_id));
            checkAutoCont(findWindow(H_id));
            narrowband = H_id != null || S_id != null || O_id != null;
            preprocessed_images = start_images.L_R_G_B;
      } else {
            preprocessed_images = start_images.NONE;
      }
      return preprocessed_images;
}

/* Create master L, R, G and B images, or a Color image
 *
 * check for preprocessed images
 * get files from dialog
 * if we have bias, dark or flat files, run  image calibration
 * by default run cosmetic correction
 * for color files do debayering
 * by default run subframe selector
 * run star alignment
 * optionally run local normalization 
 * find files for each L, R, G and B channels
 * run image integration to create L, R, G and B images, or color image
 */
function CreateChannelImages(auto_continue)
{
      addProcessingStep("CreateChannelImages");

      final_win = null;
      write_processing_log_file = false;  // do not write the log file if we fail very early

      if (auto_continue) {
            console.writeln("AutoContinue, find start images with prefix");
            preprocessed_images = findStartImages(true, false);
            if (preprocessed_images == start_images.NONE && ppar.win_prefix != "") {
                  console.writeln("AutoContinue, find start images without prefix");
                  preprocessed_images = findStartImages(true, true);
            }
      } else {
            // find old images with prefix
            preprocessed_images = findStartImages(false, false);
      }

      if (auto_continue) {
          if (preprocessed_images == start_images.NONE) {
            addProcessingStep("No preprocessed images found, processing not started!");
            return false;
          }
      } else {
            if (preprocessed_images != start_images.NONE) {
                  addProcessingStep("There are already preprocessed images, processing not started!");
                  addProcessingStep("Close or rename old images before continuing.");
                  return false;
            }  
      }

      /* Check if we have manually created mask. */
      range_mask_win = null;

      write_processing_log_file = true;

      if (preprocessed_images == start_images.FINAL) {
            return true;
      } else if (preprocessed_images != start_images.NONE) {
            addProcessingStep("Using preprocessed images " + preprocessed_images);
            console.writeln("L_BE_win="+L_BE_win);
            console.writeln("RGB_BE_win="+RGB_BE_win);
            console.writeln("L_HT_win="+L_HT_win);
            console.writeln("RGB_HT_win="+RGB_HT_win);
            if (preprocessed_images == start_images.RGB_BE ||
                preprocessed_images == start_images.RGB_HT ||
                preprocessed_images == start_images.RGB_COLOR) 
            {
                  if (narrowband) {
                        addProcessingStep("Processing as narrowband images");
                  } else {
                        /* No L files, assume color. */
                        addProcessingStep("Processing as color images");
                        is_color_files = true;
                  }
            }
            if (preprocessed_images == start_images.RGB_COLOR) {
                  RGB_win = ImageWindow.windowById(RGBcolor_id);
                  RGB_win_id = RGBcolor_id;
            }
            /* Check if we have manually created mask. */
            mask_win_id = "range_mask";
            range_mask_win = findWindow(mask_win_id);
      } else {
            /* Open dialog files and run SubframeSelector on them
             * to assigns SSWEIGHT.
             */
            var fileNames;
            if (lightFileNames == null) {
                  lightFileNames = openImageFiles("Light", true, false);
                  addProcessingStep("Get files from dialog");
            }
            if (lightFileNames == null) {
                  write_processing_log_file = false;
                  console.writeln("No files to process");
                  return false;
            }

            // We keep track of extensions added to the file names
            // If we need to original file names we can substract
            // added extensions.
            var filename_postfix = '';

            if (outputRootDir == "" || pathIsRelative(outputRootDir)) {
                  /* Get path to current directory. */
                  outputRootDir = parseNewOutputDir(lightFileNames[0], outputRootDir);
                  console.writeln("CreateChannelImages, set outputRootDir ", outputRootDir);
            }

            ensureDir(outputRootDir);
            ensureDir(combinePath(outputRootDir, AutoOutputDir));
            ensureDir(combinePath(outputRootDir, AutoProcessedDir));

            var filtered_lights = getFilterFiles(lightFileNames, pages.LIGHTS, '');
            if (isCustomMapping(filtered_lights.narrowband)
                && !par.image_weight_testing.val
                && !par.integrate_only.val
                && !par.calibrate_only.val)
            {
                  // Do a check round in custom mapping to verify that all needed
                  // channels have files.
                  // We exit with fatal error if some files are missing
                  write_processing_log_file = false;
                  customMapping(filtered_lights.allfilesarr);
                  write_processing_log_file = true;
            }

            // Run image calibration if we have calibration frames
            var calibrateInfo = calibrateEngine(filtered_lights);
            lightFileNames = calibrateInfo[0];
            filename_postfix = filename_postfix + calibrateInfo[1];

            if (par.calibrate_only.val) {
                  return(true);
            }

            if (filename_postfix != '') {
                  // We did run calibration, filter again with calibrated lights
                  var filtered_files = getFilterFiles(lightFileNames, pages.LIGHTS, filename_postfix);
            } else {
                  // Calibration was not run
                  var filtered_files = filtered_lights;
            }
            if (filtered_files.allfilesarr[channels.C].files.length == 0) {
                  is_color_files = false;
            } else {
                  is_color_files = true;
            }

            fileNames = lightFileNames;

            if (par.start_from_imageintegration.val || par.image_weight_testing.val) {
                  var skip_early_steps = true;
            } else {
                  var skip_early_steps = false;
            }

            if (par.binning.val > 0 && !skip_early_steps) {
                  if (is_color_files) {
                        addProcessingStep("No binning for color files");
                  } else {
                        fileNames = runBinningOnLights(fileNames, filtered_files);
                        filename_postfix = filename_postfix + '_b2';
                  }
            }
            if (par.ABE_on_lights.val && !skip_early_steps) {
                  fileNames = runABEOnLights(fileNames);
                  filename_postfix = filename_postfix + '_ABE';
            }
            if (!par.skip_cosmeticcorrection.val && !skip_early_steps) {
                  if (par.fix_column_defects.val || par.fix_row_defects.val) {
                        var ccFileNames = [];
                        var ccInfo = runLinearDefectDetection(fileNames);
                        for (var i = 0; i < ccInfo.length; i++) {
                              addProcessingStep("run CosmeticCorrection for linear defect file group " + i + ", " + ccInfo[i].ccFileNames.length + " files");
                              var cc = runCosmeticCorrection(ccInfo[i].ccFileNames, ccInfo[i].ccDefects, is_color_files);
                              ccFileNames = ccFileNames.concat(cc);
                        }
                        fileNames = ccFileNames;
                  } else {
                        var defects = [];
                        /* Run CosmeticCorrection for each file.
                        * Output is *_cc.xisf files.
                        */
                        fileNames = runCosmeticCorrection(fileNames, defects, is_color_files);
                  }
                  filename_postfix = filename_postfix + '_cc';
            }

            if (is_color_files && par.debayerPattern.val != 'None' && !skip_early_steps) {
                  /* After cosmetic correction we need to debayer
                   * OSC/RAW images
                   */
                  fileNames = debayerImages(fileNames);
                  filename_postfix = filename_postfix + '_b';
            }

            if (par.extract_channel_mapping.val != '') {
                  // Extract channels from color/OSC/DSLR files. As a result
                  // we get a new file list with channel files.
                  fileNames = extractChannels(fileNames);

                  // We extracted channels, filter again with extracted channels
                  console.writeln("Filter again with extracted channels")
                  filename_postfix = '';
                  is_color_files = false;
                  filtered_files = getFilterFiles(fileNames, pages.LIGHTS, filename_postfix);
                  console.writeln("Continue with mono processing")
            }

            if (!par.skip_subframeselector.val && !par.start_from_imageintegration.val) {
                  /* Run SubframeSelector that assigns SSWEIGHT for each file.
                   * Output is *_a.xisf files.
                   */
                  var names_and_weights = runSubframeSelector(fileNames);
                  filename_postfix = filename_postfix + names_and_weights.postfix;
            } else {
                  var names_and_weights = { filenames: fileNames, ssweights: [], postfix: '' };
            }

            /* Find file with best SSWEIGHT to be used
             * as a reference image in StarAlign.
             * Also possible file list filtering is done.
             */
            var retarr = findBestSSWEIGHT(names_and_weights);
            best_image = retarr[0];
            fileNames = retarr[1];

            if (par.image_weight_testing.val) {
                  return true;
            }

            /* StarAlign
            */
            if (!par.start_from_imageintegration.val) {
                  alignedFiles = runStarAlignment(fileNames, best_image);
                  filename_postfix = filename_postfix + '_r';
            } else {
                  alignedFiles = fileNames;
            }

            /* Find files for each L, R, G, B, H, O and S channels, or color files.
             */
            findLRGBchannels(alignedFiles, filename_postfix);

            /* ImageIntegration
            */
            if (C_images.images.length == 0) {
                  /* We have LRGB files. */
                  if (!par.monochrome_image.val) {
                        if (is_luminance_images) {
                              addProcessingStep("Processing as LRGB files");
                        } else {
                              addProcessingStep("Processing as RGB files");
                        }
                  } else {
                        addProcessingStep("Processing as monochrome files");
                  }
                  is_color_files = false;

                  if (is_luminance_images) {
                        L_id = runImageIntegration(L_images, 'L');
                        luminance_id = copyToMapIf(L_id);
                  }

                  if (!par.monochrome_image.val) {
                        R_id = runImageIntegration(R_images, 'R');
                        G_id = runImageIntegration(G_images, 'G');
                        B_id = runImageIntegration(B_images, 'B');
                        H_id = runImageIntegration(H_images, 'H');
                        S_id = runImageIntegration(S_images, 'S');
                        O_id = runImageIntegration(O_images, 'O');

                        windowShowif(R_id);
                        windowShowif(G_id);
                        windowShowif(B_id);
                        windowShowif(H_id);
                        windowShowif(S_id);
                        windowShowif(O_id);
                  }

            } else {
                  /* We have color files. */
                  addProcessingStep("Processing as color files");
                  is_color_files = true;
                  var color_img_id = runImageIntegration(C_images, 'RGB');
                  RGB_win = ImageWindow.windowById(color_img_id);
                  RGB_win.show();
                  RGB_win_id = color_img_id;
            }
      }
      return true;
}

/* Create  a mask from linear image. This function
 * used to create temporary masks.
 */
function CreateNewTempMaskFromLInearWin(imgWin, is_color)
{
      console.writeln("CreateNewTempMaskFromLInearWin from " + imgWin.mainView.id);

      var winCopy = copyWindowEx(imgWin, imgWin.mainView.id + "_tmp", true);

      /* Run HistogramTransform based on autostretch because mask should be non-linear. */
      runHistogramTransform(winCopy, null, is_color, 'mask');

      /* Create mask.
       */
      var maskWin = newMaskWindow(winCopy, imgWin.mainView.id + "_mask", true);

      windowCloseif(winCopy.mainView.id);

      return maskWin;
}

/* Ensure we have a mask to be used for LRGB processing. Used for example
 * for noise reduction and sharpening. We use luminance image as
 * mask.
 */
function LRGBEnsureMask()
{
      addProcessingStep("LRGBEnsureMask");

      if (winIsValid(range_mask_win)) {
            /* We already have a mask. */
            addProcessingStep("Use existing mask " + range_mask_win.mainView.id);
            mask_win = range_mask_win;
      } else {
            var L_win;
            if (preprocessed_images == start_images.L_RGB_HT) {
                  /* We have run HistogramTransformation. */
                  addProcessingStep("Using image " + L_HT_win.mainView.id + " for a mask");
                  L_win = copyWindow(L_HT_win, ppar.win_prefix + "L_win_mask");
            } else {
                  if (preprocessed_images == start_images.L_RGB_BE ||
                      preprocessed_images == start_images.L_R_G_B_BE) 
                  {
                        /* We have background extracted from L. */
                        L_win = ImageWindow.windowById(L_BE_win.mainView.id);
                        addProcessingStep("Using image " + L_BE_win.mainView.id + " for a mask");
                  } else {
                        L_win = ImageWindow.windowById(luminance_id);
                        addProcessingStep("Using image " + luminance_id + " for a mask");
                  }
                  L_win = copyWindowEx(L_win, ppar.win_prefix + "L_win_mask", true);

                  /* Run HistogramTransform based on autostretch because mask should be non-linear. */
                  runHistogramTransform(L_win, null, false, 'mask');
            }
            /* Create mask.
             */
            mask_win_id = ppar.win_prefix + "AutoMask";
            mask_win = newMaskWindow(L_win, mask_win_id, false);
            windowCloseif(L_win.mainView.id);
      }
}

/* Ensure we have mask for color processing. Mask is needed also in non-linear
 * so we do a separate runHistogramTransform here.
 */
function ColorEnsureMask(color_img_id, RBGstretched)
{
      addProcessingStep("ColorEnsureMask");

      if (winIsValid(range_mask_win)) {
            /* We already have a mask. */
            addProcessingStep("Use existing mask " + range_mask_win.mainView.id);
            mask_win = range_mask_win;
      } else {
            var color_win = ImageWindow.windowById(color_img_id);
            addProcessingStep("Using image " + color_img_id + " for a mask");
            var color_win_copy = copyWindowEx(color_win, "color_win_mask", true);

            if (!RBGstretched) {
                  /* Run HistogramTransform based on autostretch because mask should be non-linear. */
                  runHistogramTransform(color_win_copy, null, true, 'mask');
            }

            /* Create mask.
             */
            mask_win_id = ppar.win_prefix + "AutoMask";
            mask_win = newMaskWindow(color_win_copy, mask_win_id, false);
            windowCloseif(color_win_copy.mainView.id);
      }
      console.writeln("ColorEnsureMask done");
}

/* Process L image
 *
 * optionally run ABE on L image
 * by default run noise reduction on L image using a mask
 * run histogram transformation on L to make in non-linear
 * by default run noise reduction on L image using a mask
 */
function ProcessLimage(RBGmapping)
{
      addProcessingStep("Process L image");

      /* LRGB files */
      console.writeln("BE L");
      if (preprocessed_images == start_images.L_RGB_HT) {
            /* We have run HistogramTransformation. */
            addProcessingStep("Start from image " + L_HT_win.mainView.id);
            L_ABE_HT_win = L_HT_win;
            L_ABE_HT_id = L_HT_win.mainView.id;
      } else {
            if (preprocessed_images == start_images.L_RGB_BE ||
                preprocessed_images == start_images.L_R_G_B_BE) 
            {
                  /* We have background extracted from L. */
                  L_ABE_id = L_BE_win.mainView.id;
                  addProcessingStep("Start from image " + L_ABE_id);
            } else {
                  var L_win = ImageWindow.windowById(luminance_id);
                  if (!RBGmapping.stretched) {
                        /* Optionally run ABE on L
                        */
                        if (par.ABE_before_channel_combination.val) {
                              // ABE already done
                              L_ABE_id = noABEcopyWin(L_win);
                        } else if (par.use_ABE_on_L_RGB.val) {
                              // run ABE
                              L_ABE_id = runABE(L_win, false);
                        } else {
                              // no ABE
                              L_ABE_id = noABEcopyWin(L_win);
                        }
                  }
                  if (par.use_RGBNB_Mapping.val) {
                        var mapped_L_ABE_id = RGBNB_Channel_Mapping(L_ABE_id, 'L', par.L_bandwidth.val, par.L_mapping.val, par.L_BoostFactor.val);
                        mapped_L_ABE_id = windowRename(mapped_L_ABE_id, L_ABE_id + "_NB");
                        closeOneWindow(L_ABE_id);
                        L_ABE_id = mapped_L_ABE_id;
                  }
            }

            if (!RBGmapping.combined) {
                  /* Noise reduction for L. */
                  luminanceNoiseReduction(ImageWindow.windowById(L_ABE_id), mask_win);
            }

            /* On L image run HistogramTransform  to stretch image to non-linear
            */
            L_ABE_HT_id = ensure_win_prefix(L_ABE_id + "_HT");
            if (!RBGmapping.stretched) {
                  L_stf = runHistogramTransform(
                              copyWindow(ImageWindow.windowById(L_ABE_id), L_ABE_HT_id), 
                              null,
                              false,
                              'L');
                  if (!same_stf_for_all_images) {
                        L_stf = null;
                  }
            } else {
                  copyWindow(ImageWindow.windowById(L_ABE_id), L_ABE_HT_id);
                  same_stf_for_all_images = false;
                  L_stf = null;
            }

            L_ABE_HT_win = ImageWindow.windowById(L_ABE_HT_id);
            ImageWindow.windowById(L_ABE_HT_id);      
      }
}

/* Run linear fit in L, R, G and B images based on options set by user.
 */
function LinearFitLRGBchannels()
{
      addProcessingStep("LinearFitLRGBchannels");

      var use_linear_fit = par.use_linear_fit.val;

      if (luminance_id == null && use_linear_fit == 'Luminance') {
            // no luminance
            if (narrowband) {
                  addProcessingStep("No Luminance, no linear fit with narrowband");
                  use_linear_fit = 'No linear fit';
            } else {
                  addProcessingStep("No Luminance, linear fit using R with RGB");
                  use_linear_fit = 'Red';
            }
      }

      /* Check for LinearFit
       */
      if (use_linear_fit == 'Red') {
            /* Use R.
             */
            addProcessingStep("Linear fit using R");
            if (luminance_id != null) {
                  runLinearFit(red_id, luminance_id);
            }
            runLinearFit(red_id, green_id);
            runLinearFit(red_id, blue_id);
      } else if (use_linear_fit == 'Green') {
            /* Use G.
              */
            addProcessingStep("Linear fit using G");
            if (luminance_id != null) {
                  runLinearFit(green_id, luminance_id);
            }
            runLinearFit(green_id, red_id);
            runLinearFit(green_id, blue_id);
      } else if (use_linear_fit == 'Blue') {
            /* Use B.
              */
            addProcessingStep("Linear fit using B");
            if (luminance_id != null) {
                  runLinearFit(blue_id, luminance_id);
            }
            runLinearFit(blue_id, red_id);
            runLinearFit(blue_id, green_id);
      } else if (use_linear_fit == 'Luminance' && luminance_id != null) {
            /* Use L.
             */
            addProcessingStep("Linear fit using L");
            runLinearFit(luminance_id, red_id);
            runLinearFit(luminance_id, green_id);
            runLinearFit(luminance_id, blue_id);
      } else {
            addProcessingStep("No linear fit");
      }
}

/* Combine R, G and B images into one RGB image.
 *
 * optionally reduce noise on each separate R, G and B images using a mask
 * run channel combination to create RGB image
 */
function CombineRGBimage()
{
      addProcessingStep("CombineRGBimage");

      if (par.noise_reduction_strength.val > 0 && !narrowband && !par.combined_image_noise_reduction.val) {
            addProcessingStep("Noise reduction on channel images");
            channelNoiseReduction(red_id);
            channelNoiseReduction(green_id);
            channelNoiseReduction(blue_id);
      }

      /* ChannelCombination
       */
      addProcessingStep("Channel combination using images " + red_id + "," + green_id + "," + blue_id);

      var P = new ChannelCombination;
      P.colorSpace = ChannelCombination.prototype.RGB;
      P.channels = [ // enabled, id
            [true, red_id],
            [true, green_id],
            [true, blue_id]
      ];

      var model_win = ImageWindow.windowById(red_id);
      var rgb_name = ppar.win_prefix + "Integration_RGB";

      RGB_win = new ImageWindow(
                        model_win.mainView.image.width,     // int width
                        model_win.mainView.image.height,    // int height
                        3,                                  // int numberOfChannels=1
                        32,                                 // int bitsPerSample=32
                        true,                               // bool floatSample=true
                        true,                               // bool color=false
                        rgb_name);                          // const IsoString &id=IsoString()

      if (RGB_win.mainView.id != rgb_name) {
            fatalWindowNameFailed("Failed to create window with name " + rgb_name + ", window name is " + RGB_win.mainView.id);
      }
                  
      RGB_win.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(RGB_win.mainView);
      RGB_win.mainView.endProcess();
      
      RGB_win.show();
      addScriptWindow(RGB_win.mainView.id);
      RGB_win_id = RGB_win.mainView.id;
}

function extractRGBchannel(RGB_id, channel)
{
      addProcessingStep("Extract " + channel + " from " + RGB_id);
      var sourceWindow = findWindow(RGB_id);
      var P = new ChannelExtraction;
      P.colorSpace = ChannelExtraction.prototype.RGB;
      P.sampleFormat = ChannelExtraction.prototype.SameAsSource;
      switch (channel) {
            case 'R':
                  P.channels = [ // enabled, id
                        [true, ""],       // R
                        [false, ""],      // G
                        [false, ""]       // B
                  ];
                  break;
            case 'G':
                  P.channels = [ // enabled, id
                        [false, ""],      // R
                        [true, ""],       // G
                        [false, ""]       // B
                  ];
                  break;
            case 'B':
                  P.channels = [ // enabled, id
                        [false, ""],      // R
                        [false, ""],      // G
                        [true, ""]        // B
                  ];
                  break;
      }

      sourceWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(sourceWindow.mainView);
      var targetWindow = ImageWindow.activeWindow;
      sourceWindow.mainView.endProcess();

      return targetWindow.mainView.id;
}

function RGBNB_Channel_Mapping(RGB_id, channel, channel_bandwidth, mapping, BoostFactor)
{
      console.writeln("RGBNB channel mapping " + RGB_id);

      if (channel == 'L') {
            var L_win_copy = copyWindow(findWindow(RGB_id), ensure_win_prefix(RGB_id + "_RGBNBcopy"));
            var channelId = L_win_copy.mainView.id;
      } else {
            var channelId = extractRGBchannel(RGB_id, channel);
      }

      switch (mapping) {
            case 'H':
                  var NB_id = H_id;
                  var NB_bandwidth = par.H_bandwidth.val;
                  break;
            case 'S':
                  var NB_id = S_id;
                  var NB_bandwidth = par.S_bandwidth.val;
                  break;
            case 'O':
                  var NB_bandwidth = par.O_bandwidth.val;
                  var NB_id = O_id;
                  break;
            case '':
                  return channelId;
            default:
                  throwFatalError("Invalid NB mapping " + mapping);
      }
      if (NB_id == null) {
            throwFatalError("Could not find " + mapping + " image for mapping to " + channel);
      }
      if (par.use_RGB_image.val) {
            var sourceChannelId = RGB_id;
            channel_bandwidth = par.R_bandwidth.val;
      } else {
            var sourceChannelId = channelId;
      }

      addProcessingStep("Run " + channel + " mapping using " + NB_id + ", " + 
                        channel + " bandwidth " + channel_bandwidth + ", " + 
                        mapping + " bandwidth " + NB_bandwidth + 
                        " and boost factor " + BoostFactor);
      console.writeln("RGBNB_Channel_Mapping, runPixelMathSingleMapping " + sourceChannelId);
      var mappedChannelId = runPixelMathSingleMapping(
                              channelId,
                              "((" + NB_id + " * " + channel_bandwidth + ") - " + 
                              "("+ sourceChannelId + " * " + NB_bandwidth + "))" +
                              " / (" + channel_bandwidth + " - " +  NB_bandwidth + ")");
      
      console.writeln("RGBNB_Channel_Mapping, runPixelMathSingleMapping " + mappedChannelId);
      var mappedChannelId2 = runPixelMathSingleMapping(
                              mappedChannelId,
                              channelId + " + ((" + mappedChannelId + " - Med(" + mappedChannelId + ")) * " + 
                              BoostFactor + ")");
      
      runLinearFit(mappedChannelId2, mappedChannelId);

      console.writeln("RGBNB_Channel_Mapping, runPixelMathSingleMapping " + mappedChannelId2);
      var mappedChannelId3 = runPixelMathSingleMapping(
                                    mappedChannelId2,
                                    "max(" + mappedChannelId + ", " + mappedChannelId2 + ")");

      closeOneWindow(channelId);
      closeOneWindow(mappedChannelId);
      closeOneWindow(mappedChannelId2);

      return mappedChannelId3;
}

function doRGBNBmapping(RGB_id)
{
      addProcessingStep("Create mapped channel images from " + RGB_id);
      var R_mapped = RGBNB_Channel_Mapping(RGB_id, 'R', par.R_bandwidth.val, par.R_mapping.val, par.R_BoostFactor.val);
      var G_mapped = RGBNB_Channel_Mapping(RGB_id, 'G', par.G_bandwidth.val, par.G_mapping.val, par.G_BoostFactor.val);
      var B_mapped = RGBNB_Channel_Mapping(RGB_id, 'B', par.B_bandwidth.val, par.B_mapping.val, par.B_BoostFactor.val);

      /* Combine RGB image from mapped channel images. */
      addProcessingStep("Combine mapped channel images to an RGB image");
      var RGB_mapped_id = runPixelMathRGBMapping(
                              RGB_id + "_NB", 
                              findWindow(RGB_id),
                              R_mapped,
                              G_mapped,
                              B_mapped);

      closeOneWindow(R_mapped);
      closeOneWindow(G_mapped);
      closeOneWindow(B_mapped);
      closeOneWindow(RGB_id);

      return RGB_mapped_id;
}

function testRGBNBmapping()
{
      console.beginLog();

      addProcessingStep("Test narrowband mapping to RGB");

      findProcessedImages(false);

      if (RGBcolor_id == null) {
            throwFatalError("Could not find RGB image");
      }

      var color_win = findWindow(RGBcolor_id);

      checkWinFilePath(color_win);

      var test_win = copyWindow(color_win, ensure_win_prefix(RGBcolor_id + "_test"));

      doRGBNBmapping(test_win.mainView.id);
      
      addProcessingStep("Processing completed");
      writeProcessingSteps(null, true, ppar.win_prefix + "AutoRGBNB");

      console.endLog();
}

/* Process RGB image
 *
 * optionally run background neutralization on RGB image
 * by default run color calibration on RGB image
 * optionally run ABE on RBG image
 * by default run noise reduction on RGB image using a mask
 * run histogram transformation on RGB image to make in non-linear
 * optionally increase saturation
 */
function ProcessRGBimage(RBGstretched)
{
      addProcessingStep("Process RGB image, RBG stretched is " + RBGstretched);

      var RGB_ABE_HT_id;

      if (preprocessed_images == start_images.L_RGB_HT ||
            preprocessed_images == start_images.RGB_HT) 
      {
            /* We already have run HistogramTransformation. */
            RGB_ABE_HT_id = RGB_HT_win.mainView.id;
            addProcessingStep("Start from image " + RGB_ABE_HT_id);
            if (preprocessed_images == start_images.RGB_HT) {
                  ColorEnsureMask(RGB_ABE_HT_id, true);
            }
      } else {
            if (preprocessed_images == start_images.L_RGB_BE ||
                preprocessed_images == start_images.RGB_BE) 
            {
                  /* We already have background extracted. */
                  RGB_ABE_id = RGB_BE_win.mainView.id;
                  addProcessingStep("Start from image " + RGB_ABE_id);
            } else {
                  if (par.color_calibration_before_ABE.val) {
                        if (par.use_background_neutralization.val) {
                              runBackgroundNeutralization(RGB_win.mainView);
                        }
                        /* Color calibration on RGB
                        */
                        runColorCalibration(RGB_win.mainView);
                  }
                  if (par.use_ABE_on_L_RGB.val) {
                        console.writeln("ABE RGB");
                        RGB_ABE_id = runABE(RGB_win, false);
                  } else {
                        console.writeln("No ABE for RGB");
                        RGB_ABE_id = noABEcopyWin(RGB_win);
                  }
            }

            if (!par.color_calibration_before_ABE.val) {
                  if (par.use_background_neutralization.val) {
                        runBackgroundNeutralization(ImageWindow.windowById(RGB_ABE_id).mainView);
                  }
                  /* Color calibration on RGB
                  */
                  runColorCalibration(ImageWindow.windowById(RGB_ABE_id).mainView);
            }

            if (is_color_files && par.remove_stars_early.val) {
                  addProcessingStep("Remove stars from linear RGB color image");
                  removeStars(findWindow(RGB_ABE_id), true);
            }

            if (par.use_RGBNB_Mapping.val) {
                  /* Do RGBNB mapping on combined and color calibrated RGB image. */
                  RGB_ABE_id = doRGBNBmapping(RGB_ABE_id);
            }

            if (is_color_files || !is_luminance_images) {
                  /* Color or narrowband or RGB. */
                  ColorEnsureMask(RGB_ABE_id, RBGstretched);
            }
            if (narrowband && par.linear_increase_saturation.val > 0) {
                  /* Default 1 means no increase with narrowband. */
                  var linear_increase_saturation = par.linear_increase_saturation.val - 1;
            } else {
                  var linear_increase_saturation = par.linear_increase_saturation.val;
            }
            if (linear_increase_saturation > 0 && !RBGstretched) {
                  /* Add saturation linear RGB
                  */
                  console.writeln("Add saturation to linear RGB, " + linear_increase_saturation + " steps");
                  for (var i = 0; i < linear_increase_saturation; i++) {
                        increaseSaturation(ImageWindow.windowById(RGB_ABE_id), mask_win);
                  }
            }

            if (is_color_files || par.combined_image_noise_reduction.val) {
                  /* Optional noise reduction for RGB
                   */
                  runNoiseReduction(
                        ImageWindow.windowById(RGB_ABE_id),
                        mask_win);
            }
            if (!RBGstretched) {
                  /* On RGB image run HistogramTransform to stretch image to non-linear
                  */
                  RGB_ABE_HT_id = ensure_win_prefix(RGB_ABE_id + "_HT");
                  runHistogramTransform(
                        copyWindow(
                              ImageWindow.windowById(RGB_ABE_id), 
                              RGB_ABE_HT_id), 
                        L_stf,
                        true,
                        'RGB');
            } else {
                  RGB_ABE_HT_id = RGB_ABE_id;
            }
      }

      if (narrowband && par.non_linear_increase_saturation.val > 0) {
            /* Default 1 means no increase with narrowband. */
            var non_linear_increase_saturation = par.non_linear_increase_saturation.val - 1;
      } else {
            var non_linear_increase_saturation = par.non_linear_increase_saturation.val;
      }
      if (non_linear_increase_saturation > 0) {
            /* Add saturation on RGB
            */
            for (var i = 0; i < non_linear_increase_saturation; i++) {
                  increaseSaturation(ImageWindow.windowById(RGB_ABE_HT_id), mask_win);
            }
      }
      console.writeln("ProcessRGBimage done");
      return RGB_ABE_HT_id;
}

function invertImage(targetView)
{
      console.writeln("invertImage");
      var P = new Invert;

      targetView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(targetView, true);
      targetView.endProcess();
}

// Mask used when fixing star colors in narrowband images.
function createStarFixMask(imgView)
{
      if (star_fix_mask_win == null) {
            star_fix_mask_win = findWindow(ppar.win_prefix + "star_fix_mask");
      }
      if (star_fix_mask_win == null) {
            star_fix_mask_win = findWindow(ppar.win_prefix + "AutoStarFixMask");
      }
      if (star_fix_mask_win != null) {
            // Use already created start mask
            console.writeln("Use existing star mask " + star_fix_mask_win.mainView.id);
            star_fix_mask_win_id = star_fix_mask_win.mainView.id;
            return;
      }

      var P = new StarMask;
      P.waveletLayers = 8;
      P.smoothness = 8;

      imgView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(imgView, false);
      imgView.endProcess();

      star_fix_mask_win = ImageWindow.activeWindow;

      windowRenameKeepif(star_fix_mask_win.mainView.id, ppar.win_prefix + "AutoStarFixMask", true);
      star_fix_mask_win_id = star_fix_mask_win.mainView.id;

      addProcessingStep("Created star fix mask " + star_fix_mask_win.mainView.id);
}

/* Do a rough fix on magenta stars by inverting the image, applying
 * SCNR to remove the now green cast on stars and then inverting back.
 * If we are not removing all green case we use mask to protect
 * other areas than stars.
 */
function fixNarrowbandStarColor(targetWin)
{
      var use_mask;

      if (par.skip_star_fix_mask.val) {
            use_mask = false;
      } else if (!par.run_narrowband_SCNR.val || par.leave_some_green.val) {
            // If we do not remove all green we use mask protect
            // other than stars.
            use_mask = true;
      } else {
            // We want all green removed, do not use mask on stars either.
            use_mask = false;
      }

      addProcessingStep("Fix narrowband star color");

      if (use_mask) {
            createStarFixMask(targetWin.mainView);
      }

      invertImage(targetWin.mainView);

      if (use_mask) {
            /* Use mask to change only star colors. */
            addProcessingStep("Using mask " + star_fix_mask_win.mainView.id + " when fixing star colors");
            targetWin.setMask(star_fix_mask_win);
            targetWin.maskInverted = false;
      }      

      runSCNR(targetWin.mainView, true);

      if (use_mask) {
            targetWin.removeMask();
      }

      invertImage(targetWin.mainView);
}

// When start removal is run we do some things differently
// - We make a copy of the starless image
// - We make a copy of the stars image
// - Operations like HDMT and LHE are run on the starless image
// - Star reduction is done on the stars image
// - In the end starless and stars images are combined together
function extraRemoveStars(imgWin)
{
      if (par.use_starxterminator.val) {
            addProcessingStep("Run StarXTerminator on " + imgWin.mainView.id);
            var P = createNewStarXTerminator(true, false);
      } else {
            addProcessingStep("Run StarNet on " + imgWin.mainView.id);
            var P = createNewStarNet(true);
      }

      /* Remove stars from image.
       */
      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(imgWin.mainView, false);

      imgWin.mainView.endProcess();

      /* Close old star mask. StarNet will create an image called
       * star_mask and with StarXTerminator we rename _stars image
       * as star_mask 
       */
      closeOneWindow("AutoStarMask");

      /* Get star mask.
       */
      if (par.use_starxterminator.val) {
            star_mask_win_id = imgWin.mainView.id + "_stars";
            star_mask_win = findWindow(star_mask_win_id);
            console.writeln("extraRemoveStars star_mask_win_id " + star_mask_win_id);
            if (star_mask_win == null) {
                  throwFatalError("Could not find StarXTerminator stars window " + star_mask_win_id);
            }
            // StarNet generate window with name star_mask so we do the same
            // with StarXTerminator
            windowRename(star_mask_win_id, "star_mask");
            star_mask_win_id = "star_mask";
      } else {
            console.writeln("extraRemoveStars star_mask_win_id " + ImageWindow.activeWindow.mainView.id);
            star_mask_win = ImageWindow.activeWindow;
            star_mask_win_id = star_mask_win.mainView.id;
      }

      var FITSkeywords = getTargetFITSKeywordsForPixelmath(imgWin);
      setTargetFITSKeywordsForPixelmath(star_mask_win, FITSkeywords);

      ensureDir(outputRootDir);

      /* Make a copy of the stars image.
       */
      var copywin_id = imgWin.mainView.id + "_stars";
      console.writeln("extraRemoveStars copy " + star_mask_win_id + " to " + copywin_id);
      var copywin = copyWindow(star_mask_win, ensure_win_prefix(copywin_id));
      setFinalImageKeyword(copywin);
      saveProcessedWindow(outputRootDir, copywin.mainView.id);
      addProcessingStep("Stars image " + copywin.mainView.id);

      /* Make a copy of the starless image.
       */
      console.writeln("extraRemoveStars copy " + imgWin.mainView.id + " to " + imgWin.mainView.id + "_starless");
      var copywin = copyWindow(imgWin, ensure_win_prefix(imgWin.mainView.id + "_starless"));
      setFinalImageKeyword(copywin);
      saveProcessedWindow(outputRootDir, copywin.mainView.id);
      addProcessingStep("Starless image " + copywin.mainView.id);
}

function extraDarkerBackground(imgWin, maskWin)
{
      addProcessingStep("Darker background on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new CurvesTransformation;
      P.K = [ // x, y
         [0.00000, 0.00000],
         [0.53564, 0.46212],
         [1.00000, 1.00000]
      ];

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Darken only dark parts (background) of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = true;
      
      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function extraHDRMultiscaleTransform(imgWin, maskWin)
{
      addProcessingStep("HDRMultiscaleTransform on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new HDRMultiscaleTransform;
      P.medianTransform = true;
      P.deringing = true;
      P.toLightness = true;
      P.luminanceMask = true;

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Transform only light parts of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = false;
      
      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function extraLocalHistogramEqualization(imgWin, maskWin)
{
      addProcessingStep("LocalHistogramEqualization on " + imgWin.mainView.id + " using mask " + maskWin.mainView.id);

      var P = new LocalHistogramEqualization;
      P.radius = 110;
      P.slopeLimit = 1.3;
      P.amount = 1.000;
      
      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      /* Transform only light parts of the image. */
      imgWin.setMask(maskWin);
      imgWin.maskInverted = false;
      
      P.executeOn(imgWin.mainView, false);

      imgWin.removeMask();

      imgWin.mainView.endProcess();
}

function createNewStarMaskWin(imgWin)
{
      var P = new StarMask;
      P.midtonesBalance = 0.80000;        // old value -> 1.24: 0.50000
      P.waveletLayers = 6;
      P.smoothness = 8;    

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);
      P.executeOn(imgWin.mainView, false);
      imgWin.mainView.endProcess();

      return ImageWindow.activeWindow;
}

function createStarMaskIf(imgWin)
{
      star_mask_win = maskIsCompatible(imgWin, star_mask_win);
      if (star_mask_win == null) {
            star_mask_win = maskIsCompatible(imgWin, findWindow(ppar.win_prefix + "star_mask"));
      }
      if (star_mask_win == null) {
            star_mask_win = maskIsCompatible(imgWin, findWindow(ppar.win_prefix + "AutoStarMask"));
      }
      if (star_mask_win != null) {
            // Use already created start mask
            console.writeln("Use existing star mask " + star_mask_win.mainView.id);
            star_mask_win_id = star_mask_win.mainView.id;
            return;
      }

      closeOneWindow("AutoStarMask");

      star_mask_win = createNewStarMaskWin(imgWin);

      windowRenameKeepif(star_mask_win.mainView.id, "AutoStarMask", true);

      addProcessingStep("Created star mask " + star_mask_win.mainView.id);
      star_mask_win_id = star_mask_win.mainView.id;
}

function extraSmallerStars(imgWin)
{
      var targetWin = imgWin;

      createStarMaskIf(imgWin);

      if (par.extra_remove_stars.val) {
            addProcessingStep("Smaller stars on " + star_mask_win_id + 
                        " using " + par.extra_smaller_stars_iterations.val + " iterations");
            targetWin = star_mask_win;    
      } else {
            addProcessingStep("Smaller stars on " + imgWin.mainView.id + " using mask " + star_mask_win.mainView.id + 
                        " and " + par.extra_smaller_stars_iterations.val + " iterations");
      }

      if (par.extra_smaller_stars_iterations.val == 0) {
            var P = new MorphologicalTransformation;
            P.operator = MorphologicalTransformation.prototype.Erosion;
            P.amount = 0.30;
            P.selectionPoint = 0.20;
            P.structureSize = 5;
            P.structureWayTable = [ // mask
               [[
                  0x00,0x01,0x01,0x01,0x00,
                  0x01,0x01,0x01,0x01,0x01,
                  0x01,0x01,0x01,0x01,0x01,
                  0x01,0x01,0x01,0x01,0x01,
                  0x00,0x01,0x01,0x01,0x00
               ]]
            ];
      } else {
            var P = new MorphologicalTransformation;
            P.operator = MorphologicalTransformation.prototype.Selection;
            P.numberOfIterations = par.extra_smaller_stars_iterations.val;
            P.amount = 0.70;
            P.selectionPoint = 0.20;
            P.structureSize = 5;
            P.structureWayTable = [ // mask
                  [[
                        0x00,0x01,0x01,0x01,0x00,
                        0x01,0x01,0x01,0x01,0x01,
                        0x01,0x01,0x01,0x01,0x01,
                        0x01,0x01,0x01,0x01,0x01,
                        0x00,0x01,0x01,0x01,0x00
                  ]]
            ];
      }
      
      targetWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      if (!par.extra_remove_stars.val) {
            /* If we have removed stars we have only stars left and
             * no mask is needed. Otherwise use a star mask
             * to target operation only on stars.
             */
            targetWin.setMask(star_mask_win);
            targetWin.maskInverted = false;
      }
      
      P.executeOn(targetWin.mainView, false);

      if (!par.extra_remove_stars.val) {
            targetWin.removeMask();
      }

      targetWin.mainView.endProcess();
}

function extraContrast(imgWin)
{
      addProcessingStep("Increase contrast on " + imgWin.mainView.id);

      var P = new CurvesTransformation;
      P.K = [ // x, y
            [0.00000, 0.00000],
            [0.26884, 0.24432],
            [0.74542, 0.77652],
            [1.00000, 1.00000]
         ];

      imgWin.mainView.beginProcess(UndoFlag_NoSwapFile);

      P.executeOn(imgWin.mainView, false);

      imgWin.mainView.endProcess();
}

function extraStretch(win)
{
      runHistogramTransform(win, null, win.mainView.image.isColor, 'RGB');
}

function extraNoiseReduction(win, mask_win)
{
      if (par.extra_noise_reduction_strength.val == 0) {
            return;
      }
      addProcessingStep("Extra noise reduction on " + win.mainView.id);

      runMultiscaleLinearTransformReduceNoise(
            win, 
            mask_win, 
            par.extra_noise_reduction_strength.val);
}

function extraABE(extraWin)
{
      runABE(extraWin, true);
}

function is_non_starless_option()
{
      return par.extra_ABE.val || 
             par.extra_darker_background.val || 
             par.extra_HDRMLT.val || 
             par.extra_LHE.val || 
             par.extra_contrast.val ||
             par.extra_stretch.val ||
             par.extra_noise_reduction.val ||
             par.extra_smaller_stars.val;
}

function is_extra_option()
{
      return par.extra_remove_stars.val || 
             is_non_starless_option();
}

function is_narrowband_option()
{
      return par.fix_narrowband_star_color.val ||
             par.run_hue_shift.val ||
             par.run_narrowband_SCNR.val ||
             par.leave_some_green.val;
}

function isbatchNarrowbandPaletteMode()
{
      return par.custom_R_mapping.val == "All" && par.custom_G_mapping.val == "All" && par.custom_B_mapping.val == "All";
}

// Rename and save palette batch image
function narrowbandPaletteBatchFinalImage(palette_name, winId, extra)
{
      // rename and save image using palette name
      console.writeln("AutoIntegrateNarrowbandPaletteBatch:rename " + winId + " using " + palette_name);
      var palette_image = mapBadChars(palette_name);
      palette_image = "Auto_" + palette_image;
      if (extra) {
            palette_image = palette_image + "_extra";
      }
      console.writeln("AutoIntegrateNarrowbandPaletteBatch:new name " + palette_image);+
      windowRenameKeepif(winId, palette_image, true);
      // set final image keyword so it easy to save all file e.g. as 16 bit TIFF
      console.writeln("AutoIntegrateNarrowbandPaletteBatch:set final image keyword");
      setFinalImageKeyword(ImageWindow.windowById(palette_image));
      // save image
      console.writeln("AutoIntegrateNarrowbandPaletteBatch:save image " + palette_image);
      saveProcessedWindow(outputRootDir, palette_image);
      addProcessingStep("Narrowband palette batch final image " + palette_image);
}

// Run through all narrowband palette options
function AutoIntegrateNarrowbandPaletteBatch(auto_continue)
{
      console.writeln("AutoIntegrateNarrowbandPaletteBatch");
      for (var i = 0; i < narrowBandPalettes.length; i++) {
            console.writeln("AutoIntegrateNarrowbandPaletteBatch loop ", i);
            if (narrowBandPalettes[i].all) {
                  if (auto_continue) {
                        ensureDialogFilePath("narrowband batch result files");
                  }
                  par.custom_R_mapping.val = narrowBandPalettes[i].R;
                  par.custom_G_mapping.val = narrowBandPalettes[i].G;
                  par.custom_B_mapping.val = narrowBandPalettes[i].B;
                  addProcessingStep("Narrowband palette " + narrowBandPalettes[i].name + " batch using " + par.custom_R_mapping.val + ", " + par.custom_G_mapping.val + ", " + par.custom_B_mapping.val);

                  var succ = AutoIntegrateEngine(auto_continue);
                  if (!succ) {
                        addProcessingStep("Narrowband palette batch could not process all palettes");
                  }
                  // rename and save the final image
                  narrowbandPaletteBatchFinalImage(narrowBandPalettes[i].name, ppar.win_prefix + "AutoRGB", false);
                  if (findWindow(ppar.win_prefix + "AutoRGB_extra") != null) {
                        narrowbandPaletteBatchFinalImage(narrowBandPalettes[i].name, ppar.win_prefix + "AutoRGB_extra", true);
                  }
                  // next runs are always auto_continue
                  console.writeln("AutoIntegrateNarrowbandPaletteBatch:set auto_continue = true");
                  auto_continue = true;
                  // close all but integrated images
                  console.writeln("AutoIntegrateNarrowbandPaletteBatch:close all windows");
                  closeAllWindows(true, true);
            }
      }
      addProcessingStep("Narrowband palette batch completed");
}

function extraProcessing(id, apply_directly)
{
      var extra_id = id;
      var need_L_mask = par.extra_darker_background.val || 
                        par.extra_HDRMLT.val || 
                        par.extra_LHE.val ||
                        par.extra_noise_reduction.val;

      var extraWin = ImageWindow.windowById(id);

      checkWinFilePath(extraWin);
      ensureDir(outputRootDir);
      ensureDir(combinePath(outputRootDir, AutoOutputDir));
      ensureDir(combinePath(outputRootDir, AutoProcessedDir));

      if (!apply_directly) {
            extra_id = ensure_win_prefix(id + "_extra");
            extraWin = copyWindow(extraWin, extra_id);
      }

      if (narrowband) {
            if (par.run_hue_shift.val) {
                  narrowbandHueShift(extraWin.mainView);
            }
            if (par.run_narrowband_SCNR.val || par.leave_some_green.val) {
                  runSCNR(extraWin.mainView, false);
            }
            if (par.fix_narrowband_star_color.val) {
                  fixNarrowbandStarColor(extraWin);
            }
      }
      if (par.extra_remove_stars.val) {
            extraRemoveStars(extraWin);
      }
      if (par.extra_ABE.val) {
            extraABE(extraWin);
      }
      if (need_L_mask) {
            // Try find mask window
            // If we need to create a mask di it after we
            // have removed the stars
            mask_win = maskIsCompatible(extraWin, mask_win);
            if (mask_win == null) {
                  mask_win = maskIsCompatible(extraWin, findWindow(ppar.win_prefix + "range_mask"));
            }
            if (mask_win == null) {
                  mask_win = maskIsCompatible(extraWin, findWindow(ppar.win_prefix +"AutoMask"));
            }
            if (mask_win == null) {
                  mask_win_id = ppar.win_prefix + "AutoMask";
                  closeOneWindow(mask_win_id);
                  mask_win = newMaskWindow(extraWin, mask_win_id, false);
            }
            console.writeln("Use mask " + mask_win.mainView.id);
      }
      if (par.extra_darker_background.val) {
            extraDarkerBackground(extraWin, mask_win);
      }
      if (par.extra_HDRMLT.val) {
            extraHDRMultiscaleTransform(extraWin, mask_win);
      }
      if (par.extra_LHE.val) {
            extraLocalHistogramEqualization(extraWin, mask_win);
      }
      if (par.extra_contrast.val) {
            for (var i = 0; i < par.extra_contrast_iterations.val; i++) {
                  extraContrast(extraWin);
            }
      }
      if (par.extra_stretch.val) {
            extraStretch(extraWin);
      }
      if (par.extra_noise_reduction.val) {
            extraNoiseReduction(extraWin, mask_win);
      }
      if (par.extra_smaller_stars.val) {
            extraSmallerStars(extraWin);
      }
      if (par.extra_remove_stars.val) {
            /* Restore stars by combining starless image and stars. */
            addProcessingStep("Restore stars by combining " + extraWin.mainView.id + " and " + star_mask_win_id);
            runPixelMathSingleMappingEx(
                  extraWin.mainView.id, 
                  extraWin.mainView.id + " + " + star_mask_win_id,
                  false);
            // star_mask_win_id was a temp window with maybe smaller stars
            closeOneWindow(star_mask_win_id);
      }
      if (apply_directly) {
            setFinalImageKeyword(ImageWindow.windowById(extraWin.mainView.id));
      } else {
            setFinalImageKeyword(ImageWindow.windowById(extra_id));
            saveProcessedWindow(outputRootDir, extra_id); /* Extra window */
      }
}

function extraProcessingEngine(id)
{
      mask_win = null;
      mask_win_id = null;
      star_mask_win = null;
      star_mask_win_id = null;
      star_fix_mask_win = null;
      star_fix_mask_win_id = null;
      processing_steps = "";

      console.noteln("Start extra processing...");

      console.show(true);
      extraProcessing(extra_target_image, true);
      console.show(false);

      windowIconizeAndKeywordif(mask_win_id);             /* AutoMask or range_mask window */
      windowIconizeAndKeywordif(star_mask_win_id);        /* AutoStarMask or star_mask window */
      windowIconizeAndKeywordif(star_fix_mask_win_id);    /* AutoStarFixMask or star_fix_mask window */

      console.noteln("Processing steps:");
      console.writeln(processing_steps);
      console.writeln("");
      console.noteln("Extra processing completed.");
}

/* Map background extracted channel images to start images.
 */
function mapBEchannels()
{
      if (L_BE_win != null) {
            L_id = L_BE_win.mainView.id;
      }
      if (R_BE_win != null) {
            R_id = R_BE_win.mainView.id;
      }
      if (G_BE_win != null) {
            G_id = G_BE_win.mainView.id;
      }
      if (B_BE_win != null) {
            B_id = B_BE_win.mainView.id;
      }
      if (H_BE_win != null) {
            H_id = H_BE_win.mainView.id;
      }
      if (S_BE_win != null) {
            S_id = S_BE_win.mainView.id;
      }
      if (O_BE_win != null) {
            O_id = O_BE_win.mainView.id;
      }
      if (RGB_BE_win != null) {
            RGBcolor_id = RGB_BE_win.mainView.id;
      }
}

function AutoIntegrateEngine(auto_continue)
{
      if (extra_target_image != "Auto") {
            console.criticalln("Extra processing target image can be used only with Apply button!");
            return false;
      }

      var LRGB_ABE_HT_id = null;
      var RGB_ABE_HT_id = null;
      var LRGB_Combined = null;

      is_color_files = false;
      luminance_id = null;
      red_id = null;
      green_id = null;
      blue_id = null;
      L_id = null;
      R_id = null;
      G_id = null;
      B_id = null;
      H_id = null;
      S_id = null;
      O_id = null;
      R_ABE_id = null;
      G_ABE_id = null;
      B_ABE_id = null;
      RGB_win_id = null;
      start_time = Date.now();
      mask_win = null;
      star_mask_win = null;
      star_fix_mask_win = null;
      ssweight_set = false;

      console.beginLog();
      console.show(true);

      processingDate = new Date;
      processing_steps = "";
      all_windows = [];
      iconPoint = null;
      L_stf = null;
      linear_fit_done = false;
      narrowband = autocontinue_narrowband;
      is_luminance_images = false;

      console.noteln("--------------------------------------");
      addProcessingStep("PixInsight version " + pixinsight_version_str);
      addProcessingStep(autointegrate_version);
      var processingOptions = getProcessingOptions();
      if (processingOptions.length > 0) {
            addProcessingStep("Processing options:");
            for (var i = 0; i < processingOptions.length; i++) {
                  addProcessingStep(processingOptions[i][0] + " " + processingOptions[i][1]);
            }
      } else {
            addProcessingStep("Using default processing options");
      }
      console.noteln("--------------------------------------");
      addProcessingStep("Start processing...");

      /* Create images for each L, R, G and B channels, or Color image. */
      if (!CreateChannelImages(auto_continue)) {
            console.criticalln("Failed!");
            console.endLog();
            return false;
      }
      
      /* Now we have L (Gray) and R, G and B images, or just RGB image
       * in case of color files.
       *
       * We keep integrated L and RGB images so it is
       * possible to continue manually if automatic
       * processing is not good enough.
       */

      if (par.calibrate_only.val) {
            preprocessed_images = start_images.CALIBRATE_ONLY;
      } else if (preprocessed_images == start_images.FINAL) {
            // We have a final image, just run run possible extra processing steps
            LRGB_ABE_HT_id = final_win.mainView.id;
      } else if (!par.image_weight_testing.val 
                 && !par.integrate_only.val 
                 && preprocessed_images != start_images.FINAL) 
      {
            var processRGB = !is_color_files && 
                             !par.monochrome_image.val &&
                             (preprocessed_images == start_images.NONE ||
                              preprocessed_images == start_images.L_R_G_B_BE ||
                              preprocessed_images == start_images.L_R_G_B);
            var RBGmapping = { combined: false, stretched: false};

            if (preprocessed_images == start_images.L_R_G_B_BE) {
                  mapBEchannels();
            }
            if (processRGB) {
                  /* Do possible channel mapping. After that we 
                   * have red_id, green_id and blue_id.
                   * Or we may have a mapped RGB image.
                   */
                  RBGmapping = mapLRGBchannels();
                  if (!RBGmapping.combined) {
                        // We have not yet combined the RGB image
                        if (par.ABE_before_channel_combination.val) {
                              addProcessingStep("Run ABE on channel images");
                              if (luminance_id != null) {
                                    run_ABE_before_channel_combination(luminance_id);
                              }
                              run_ABE_before_channel_combination(red_id);
                              run_ABE_before_channel_combination(green_id);
                              run_ABE_before_channel_combination(blue_id);
                        }
                        LinearFitLRGBchannels();
                        if (par.remove_stars_early.val) {
                              addProcessingStep("Remove stars from linear RGB channel images");
                              removeStars(findWindow(red_id), true);
                              removeStars(findWindow(green_id), true);
                              removeStars(findWindow(blue_id), true);
                        }
                  }
            }

            if (!is_color_files && is_luminance_images) {
                  /* This need to be run early as we create a mask from
                   * L image.
                   */
                  if (par.remove_stars_early.val) {
                        addProcessingStep("Remove stars from linear L channel image");
                        removeStars(findWindow(luminance_id), true);
                  }
                  LRGBEnsureMask();
                  ProcessLimage(RBGmapping);
            }

            if (processRGB && !RBGmapping.combined) {
                  CombineRGBimage();
            }

            if (par.monochrome_image.val) {
                  console.writeln("monochrome image, rename windows")
                  LRGB_ABE_HT_id = windowRename(L_ABE_HT_win.mainView.id, ppar.win_prefix + "AutoMono");

            } else if (!par.channelcombination_only.val) {

                  RGB_ABE_HT_id = ProcessRGBimage(RBGmapping.stretched);

                  if (is_color_files || !is_luminance_images) {
                        /* Keep RGB_ABE_HT_id separate from LRGB_ABE_HT_id which
                         * will be the final result file.
                         */
                        LRGB_ABE_HT_id = "copy_" + RGB_ABE_HT_id;
                        copyWindow(
                              ImageWindow.windowById(RGB_ABE_HT_id), 
                              LRGB_ABE_HT_id);
                  } else {
                        /* LRGB files. Combine L and RGB images.
                        */
                        LRGB_ABE_HT_id = runLRGBCombination(
                                          RGB_ABE_HT_id,
                                          L_ABE_HT_id);
                        LRGB_Combined = LRGB_ABE_HT_id;
                        copyWindow(
                              ImageWindow.windowById(LRGB_ABE_HT_id), 
                              "copy_" + LRGB_ABE_HT_id);
                        LRGB_ABE_HT_id = "copy_" + LRGB_ABE_HT_id;
                  }

                  /* Optional ACDNR noise reduction for RGB. Used mostly to reduce black
                   * spots left from previous noise reduction.
                   */
                  runACDNRReduceNoise(ImageWindow.windowById(LRGB_ABE_HT_id), mask_win);

                  /* Optional color noise reduction for RGB.
                   */
                  runColorReduceNoise(ImageWindow.windowById(LRGB_ABE_HT_id));

                  if (!narrowband && !par.use_RGBNB_Mapping.val) {
                        /* Remove green cast, run SCNR
                         */
                        runSCNR(ImageWindow.windowById(LRGB_ABE_HT_id).mainView, false);
                  }
          
                  /* Sharpen image, use mask to sharpen mostly the light parts of image.
                  */
                  runMultiscaleLinearTransformSharpen(
                        ImageWindow.windowById(LRGB_ABE_HT_id),
                        mask_win);
          
                  /* Rename some windows. Need to be done before iconize.
                  */
                  if (!is_color_files && is_luminance_images) {
                        /* LRGB files */
                        if (par.RRGB_image.val) {
                              LRGB_ABE_HT_id = windowRename(LRGB_ABE_HT_id, ppar.win_prefix + "AutoRRGB");
                        } else {
                              LRGB_ABE_HT_id = windowRename(LRGB_ABE_HT_id, ppar.win_prefix + "AutoLRGB");
                        }
                  } else {
                        /* Color or narrowband or RGB files */
                        LRGB_ABE_HT_id = windowRename(LRGB_ABE_HT_id, ppar.win_prefix + "AutoRGB");
                  }
            }
      }

      if (is_extra_option() || is_narrowband_option()) {
            extraProcessing(LRGB_ABE_HT_id, false);
      }

      ensureDialogFilePath("processed files");

      if (preprocessed_images < start_images.L_R_G_B_BE) {
            // We have generated integrated images, save them
            saveProcessedWindow(outputRootDir, L_id);                    /* Integration_L */
            saveProcessedWindow(outputRootDir, R_id);                    /* Integration_R */
            saveProcessedWindow(outputRootDir, G_id);                    /* Integration_G */
            saveProcessedWindow(outputRootDir, B_id);                    /* Integration_B */
            saveProcessedWindow(outputRootDir, H_id);                    /* Integration_H */
            saveProcessedWindow(outputRootDir, S_id);                    /* Integration_S */
            saveProcessedWindow(outputRootDir, O_id);                    /* Integration_O */
      }
      if (preprocessed_images >= start_images.L_R_G_B_BE) {
            // We have generated RGB image, save it
            saveProcessedWindow(outputRootDir, RGB_win_id);              /* Integration_RGB */
      }
      if (preprocessed_images < start_images.FINAL) {
            // We have generated final image, save it
            saveProcessedWindow(outputRootDir, LRGB_ABE_HT_id);          /* Final image. */
      }

      /* All done, do cleanup on windows on screen 
       */
      addProcessingStep("Processing completed");

      closeTempWindows();
      if (!par.calibrate_only.val) {
            closeAllWindowsFromArray(calibrate_windows);
      }

      windowIconizeAndKeywordif(L_id);                    /* Integration_L */
      windowIconizeAndKeywordif(R_id);                    /* Integration_R */
      windowIconizeAndKeywordif(G_id);                    /* Integration_G */
      windowIconizeAndKeywordif(B_id);                    /* Integration_B */
      windowIconizeAndKeywordif(H_id);                    /* Integration_H */
      windowIconizeAndKeywordif(S_id);                    /* Integration_S */
      windowIconizeAndKeywordif(O_id);                    /* Integration_O */
      windowIconizeAndKeywordif(RGB_win_id);              /* Integration_RGB */

      windowIconizeAndKeywordif(L_ABE_id);
      windowIconizeAndKeywordif(R_ABE_id);
      windowIconizeAndKeywordif(G_ABE_id);
      windowIconizeAndKeywordif(B_ABE_id);
      windowIconizeAndKeywordif(RGB_ABE_id);

      windowIconizeAndKeywordif(RGB_ABE_HT_id);
      windowIconizeAndKeywordif(L_ABE_HT_id);
      windowIconizeAndKeywordif(LRGB_Combined);           /* LRGB Combined image */
      windowIconizeAndKeywordif(mask_win_id);             /* AutoMask or range_mask window */
      windowIconizeAndKeywordif(star_mask_win_id);        /* AutoStarMask or star_mask window */
      windowIconizeAndKeywordif(star_fix_mask_win_id);    /* AutoStarFixMask or star_fix_mask window */

      if (par.batch_mode.val > 0) {
            /* Rename image based on first file directory name. 
             * First check possible device in Windows (like c:)
             */
            var fname = lightFileNames[0];
            console.writeln("Batch mode, get directory from file " + fname);
            var ss = fname.split(':');
            if (ss.length > 1) {
                  fname = ss[ss.length-1];
            }
            /* Then check Windows path separator \ */
            ss = fname.split('\\');
            if (ss.length > 1) {
                  fname = ss[ss.length-2];
            }
            /* Then check Unix path separator / */
            ss = fname.split('/');
            if (ss.length > 1) {
                  fname = ss[ss.length-2];
            }
            if (!isNaN(Number(fname.substring(0, 1)))) {
                  // We have number which is not valid
                  fname = 'P' + fname;
            }
            addProcessingStep("Batch mode, rename " + LRGB_ABE_HT_id + " to " + fname);
            LRGB_ABE_HT_id = windowRenameKeepifEx(LRGB_ABE_HT_id, fname, true, true);
            saveProcessedWindow(outputRootDir, LRGB_ABE_HT_id);          /* Final renamed batch image. */
      }

      if (LRGB_ABE_HT_id != null) {
            console.writeln("Set final image keyword");
            // set final image keyword so it easy to save all file e.g. as 16 bit TIFF
            setFinalImageKeyword(ImageWindow.windowById(LRGB_ABE_HT_id));
      }
      if (preprocessed_images == start_images.NONE && !par.image_weight_testing.val) {
            /* Output some info of files.
            */
            addProcessingStep("* All data files *");
            addProcessingStep(alignedFiles.length + " files accepted");
            addProcessingStep("best_ssweight="+best_ssweight);
            addProcessingStep("best_image="+best_image);
            var totalexptime = L_images.exptime + R_images.exptime + G_images.exptime +
                               B_images.exptime + C_images.exptime;
            addProcessingStep("total exptime="+totalexptime);
            
            console.writeln("");

            if (!is_color_files) {
                  /* LRGB files */
                  if (is_luminance_images) {
                        printImageInfo(L_images, "L");
                  }

                  if (!par.monochrome_image.val) {
                        printImageInfo(R_images, "R");
                        printImageInfo(G_images, "G");
                        printImageInfo(B_images, "B");
                        printImageInfo(H_images, "H");
                        printImageInfo(S_images, "S");
                        printImageInfo(O_images, "O");
                  }
            } else {
                  /* Color files */
                  printImageInfo(C_images, "Color");
            }
      }
      var end_time = Date.now();
      addProcessingStep("Script completed, time "+(end_time-start_time)/1000+" sec");
      console.noteln("======================================");

      if (get_process_defaults) {
            getProcessDefaultValues();
      }

      if (preprocessed_images != start_images.FINAL || get_process_defaults) {
            writeProcessingSteps(alignedFiles, auto_continue, null);
      }

      console.noteln("Processing steps:");
      console.writeln(processing_steps);
      console.writeln("--------------------------------------");
      var processingOptions = getProcessingOptions();
      if (processingOptions.length > 0) {
            console.writeln("Processing options:");
            for (var i = 0; i < processingOptions.length; i++) {
                  console.writeln(processingOptions[i][0] + " " + processingOptions[i][1]);
            }
      } else {
            addProcessingStep("Default processing options were used");

      }
      console.writeln("--------------------------------------");
      if (preprocessed_images != start_images.FINAL) {
            console.noteln("Console output is written into file " + logfname);
      }
      console.noteln("Processing completed.");

      return true;
}

function printImageInfo(images, name)
{
      if (images.images.length == 0) {
            return;
      }
      addProcessingStep("* " + name + " " + images.images.length + " data files *");
      addProcessingStep(name + " images best ssweight: "+images.best_ssweight);
      addProcessingStep(name + " images best image: "+images.best_image);
      addProcessingStep(name + " exptime: "+images.exptime);
}

// Dialog functions are below this point

function newCheckBox( parent, checkboxText, param, toolTip )
{
      var widget = new CheckBox( parent );
      widget.text = checkboxText;
      widget.checked = param.val;
      widget.onClick = function(checked) { 
            param.val = checked; 
      }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { 
            widget.toolTip = toolTip; 
      }

      param.reset = function() {
            widget.checked = param.val;
      };

      return widget;
}

function newGroupBox( parent, title, toolTip )
{
      var widget = new GroupBox( parent );
      if ( typeof title !== 'undefined' && title != null ) { 
            widget.title = title; 
      }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { 
            widget.toolTip = toolTip; 
      }

      return widget;
}

function Autorun(parent)
{
      var stopped = true;
      var savedOutputRootDir = outputRootDir;
      batch_narrowband_palette_mode = isbatchNarrowbandPaletteMode();
      if (par.batch_mode.val) {
            stopped = false;
            console.writeln("AutoRun in batch mode");
      } else if (batch_narrowband_palette_mode) {
            console.writeln("AutoRun in narrowband palette batch mode");
      } else {
            console.writeln("AutoRun");
      }
      do {
            if (lightFileNames == null) {
                  lightFileNames = openImageFiles("Light", true, false);
                  if (lightFileNames != null) {
                        parent.dialog.treeBox[pages.LIGHTS].clear();
                        addFilesToTreeBox(parent.dialog, pages.LIGHTS, lightFileNames);
                        updateInfoLabel(parent.dialog);
                  }
            }
            if (lightFileNames != null) {
                  try {
                        if (batch_narrowband_palette_mode) {
                              AutoIntegrateNarrowbandPaletteBatch(false);
                        } else {
                              AutoIntegrateEngine(false);
                        }
                  } 
                  catch(err) {
                        console.criticalln(err);
                        console.criticalln("Processing stopped!");
                        writeProcessingSteps(null, false, null);
                  }
                  if (par.batch_mode.val) {
                        outputRootDir = savedOutputRootDir;
                        lightFileNames = null;
                        console.writeln("AutoRun in batch mode");
                        closeAllWindows(par.keep_integrated_images.val, true);
                  }
            } else {
                  stopped = true;
            }
      } while (!stopped);
      outputRootDir = savedOutputRootDir;
}

function newSectionLabel(parent, text)
{
      var lbl = new Label( parent );
      lbl.useRichText = true;
      lbl.text = '<p style="color:SlateBlue"><b>' + text + "</b></p>";

      return lbl;
}

function newLabel(parent, text, tip)
{
      var lbl = new Label( parent );
      lbl.text = text;
      lbl.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      lbl.toolTip = tip;

      return lbl;
}

function newNumericEdit(parent, txt, param, tooltip)
{
      var edt = new NumericEdit( parent );
      edt.label.text = txt;
      edt.real = true;
      edt.edit.setFixedWidth( 6 * parent.font.width( "0" ) );
      edt.onValueUpdated = function(value) { 
            param.val = value; 
      };
      edt.setPrecision( 1 );
      edt.setRange(0.1, 999);
      edt.setValue(param.val);
      edt.toolTip = tooltip;
      param.reset = function() {
            edt.setValue(param.val);
      };
      return edt;
}

function newNumericControl(parent, txt, param, min, max, tooltip)
{
      var edt = new NumericControl( parent );
      edt.label.text = txt;
      edt.setRange(min, max);
      edt.setPrecision(1);
      edt.setValue(param.val);
      edt.onValueUpdated = function(value) { 
            param.val = value; 
      };
      edt.toolTip = tooltip;
      param.reset = function() {
            edt.setValue(param.val);
      };
      return edt;
}

function newSpinBox(parent, param, min, max, tooltip)
{
      var edt = new SpinBox( parent );
      edt.minValue = min;
      edt.maxValue = max;
      edt.value = param.val;
      edt.toolTip = tooltip;
      edt.onValueUpdated = function( value )
      {
            param.val = value;
      };

      param.reset = function() {
            edt.value = param.val;
      };

      return edt;
}

function addArrayToComboBox(cb, arr)
{
      for (var i = 0; i < arr.length; i++) {
            cb.addItem( arr[i] );
      }
}

function newComboBox(parent, param, valarray, tooltip)
{
      var cb = new ComboBox( parent );
      cb.toolTip = tooltip;
      addArrayToComboBox(cb, valarray);
      cb.currentItem = valarray.indexOf(param.val);
      cb.onItemSelected = function( itemIndex ) {
            param.val = valarray[itemIndex];
      };

      param.reset = function() {
            cb.currentItem = valarray.indexOf(param.val);
      }
      
      return cb;
}

function newComboBoxStrvals(parent, param, valarray, tooltip)
{
      var cb = new ComboBox( parent );
      cb.toolTip = tooltip;
      addArrayToComboBox(cb, valarray);
      cb.currentItem = valarray.indexOf(param.val.toString());
      cb.onItemSelected = function( itemIndex ) {
            param.val = parseInt(valarray[itemIndex]);
      };

      param.reset = function() {
            cb.currentItem = valarray.indexOf(param.val.toString());
      }
      
      return cb;
}

function newComboBoxpalette(parent, param, valarray, tooltip)
{
      var cb = new ComboBox( parent );
      cb.enabled = true;
      cb.editEnabled = true;
      addArrayToComboBox(cb, valarray);
      cb.toolTip = tooltip;
      cb.onEditTextUpdated = function() { 
            param.val = cb.editText.trim(); 
      };
      param.reset = function() {
            cb.editText = param.val;
      }
      return cb;
}

function filesOptionsSizer(parent, name, toolTip)
{
      var label = newSectionLabel(parent, name);
      label.toolTip = toolTip;
      var labelempty = new Label( parent );
      labelempty.text = " ";

      var sizer = new VerticalSizer;
      sizer.margin = 6;
      sizer.spacing = 4;

      sizer.add( label );
      sizer.add( labelempty );

      return sizer;
}

function showOrHideFilterSectionBar(pageIndex)
{
      switch (pageIndex) {
            case pages.LIGHTS:
                  var show = par.lights_add_manually.val || par.skip_autodetect_filter.val;
                  break;
            case pages.FLATS:
                  var show = par.flats_add_manually.val || par.skip_autodetect_filter.val;
                  break;
            default:
                  throwFatalError("showOrHideFilterSectionBar bad pageIndex " + pageIndex);
      }
      if (show) {
            filterSectionbars[pageIndex].show();
            filterSectionbarcontrols[pageIndex].visible = true;
      } else {
            filterSectionbars[pageIndex].hide();
            filterSectionbarcontrols[pageIndex].visible = false;
      }
}

function lightsOptions(parent)
{
      var sizer = filesOptionsSizer(parent, "Add light images", parent.filesToolTip[0]);

      var debayerLabel = new Label( parent );
      debayerLabel.text = "Debayer";
      debayerLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      debayerLabel.toolTip = "<p>Select bayer pattern for debayering color/OSC/RAW/DSLR files.</p>" +
                      "<p>Auto option tries to recognize debayer pattern from image metadata.</p>" +
                      "<p>If images are already debayered choose none which does not do debayering.</p>";

      var debayerCombobox = newComboBox(parent, par.debayerPattern, debayerPattern_values, debayerLabel.toolTip);

      var extractChannelsLabel = new Label( parent );
      extractChannelsLabel.text = "Extract channels";
      extractChannelsLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      extractChannelsLabel.toolTip = 
            "<p>Extract channels from color/OSC/RAW/DSLR files.</p>" +
            "<p>Channel extraction is done right after debayering. After channels are extracted " + 
            "processing continues as mono processing with separate filter files.</p>" +
            "<p>Option LRGB extract lightness channels as L and color channels as separate R, G and B files.</p>" +
            "<p>Option HOS extract channels as RGB=HOS and option HSO extract channels RGB=HSO. " + 
            "Resulting channels can then be mixed as needed using PixMath expressions in color " + 
            "palette section.</p>" +
            "<p>Channel files have a channel name (_L, _R, etc.) at the end of the file name. Script " + 
            "can then automatically recognize files as filter files.</p>"
            ;

      var extractChannelsCombobox = newComboBox(parent, par.extract_channel_mapping, extract_channel_mapping_values, extractChannelsLabel.toolTip);

      var add_manually_checkbox = newCheckBox(parent, "Add manually", par.lights_add_manually, 
            "<p>Add light files manually by selecting files for each filter.</p>" );
      add_manually_checkbox.onClick = function(checked) { 
            par.lights_add_manually.val = checked; 
            showOrHideFilterSectionBar(pages.LIGHTS);
      }

      sizer.add(debayerLabel);
      sizer.add(debayerCombobox);
      sizer.add(extractChannelsLabel);
      sizer.add(extractChannelsCombobox);
      sizer.add(add_manually_checkbox);
      sizer.addStretch();

      return sizer;
}

function biasOptions(parent)
{
      var sizer = filesOptionsSizer(parent, "Add bias images", parent.filesToolTip[1]);

      var checkbox = newCheckBox(parent, "SuperBias", par.create_superbias, 
            "<p>Create SuperBias from bias files.</p>" );

      sizer.add(checkbox);
      sizer.addStretch();

      return sizer;
}

function darksOptions(parent)
{
      var sizer = filesOptionsSizer(parent, "Add dark images", parent.filesToolTip[2]);

      var checkbox = newCheckBox(parent, "Pre-calibrate", par.pre_calibrate_darks, 
            "<p>If checked darks are pre-calibrated with bias and not during ImageCalibration. " + 
            "Normally this is not recommended and it is better to calibrate darks during " + 
            "ImageCalibration.</p>" );
      var checkbox2 = newCheckBox(parent, "Optimize", par.optimize_darks, 
            "<p>If checked darks are optimized when calibrating lights." + 
            "</p><p>" +
            "Normally using optimize flag should not cause any problems. " +
            "With cameras without temperature control it can greatly improve the results. " +
            'With cameras that have "amplifier glow" dark optimization may give worse results. ' +
            "</p><p>" +
            "When Optimize is not checked bias frames are ignored and dark and flat file optimize " + 
            "and calibrate flags are disabled in light file calibration. " +
            "</p>" );

      sizer.add(checkbox);
      sizer.add(checkbox2);
      sizer.addStretch();

      return sizer;
}

function flatsOptions(parent)
{
      var sizer = filesOptionsSizer(parent, "Add flat images", parent.filesToolTip[3]);

      var checkboxStars = newCheckBox(parent, "Stars in flats", par.stars_in_flats, 
            "<p>If you have stars in your flats then checking this option will lower percentile " + 
            "clip values and should help remove the stars.</p>" );
      var checkboxDarks = newCheckBox(parent, "Do not use darks", par.no_darks_on_flat_calibrate, 
            "<p>For some sensors darks should not be used to calibrate flats.  " + 
            "An example of such sensor is most CMOS sensors.</p>"  +
            "<p>If flat darks are selected then darks are not used " + 
            "to calibrate flats.</p>");
      var checkboxManual = newCheckBox(parent, "Add manually", par.flats_add_manually, 
            "<p>Add flat files manually by selecting files for each filter.</p>" );
      checkboxManual.onClick = function(checked) {
            par.flats_add_manually.val = checked;
            showOrHideFilterSectionBar(pages.FLATS);
      }

      sizer.add(checkboxStars);
      sizer.add(checkboxDarks);
      sizer.add(checkboxManual);
      sizer.addStretch();

      return sizer;
}

function flatdarksOptions(parent)
{
      var sizer = filesOptionsSizer(parent, "Add flat dark images", parent.filesToolTip[4]);

      return sizer;
}

function addOutputDir(parent)
{
      var lbl = new Label( parent );
      lbl.text = "Output directory";
      lbl.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      lbl.toolTip = "<p>Give output root directory.</p>" +
                    "<p>If no directory is given then the path to the " + 
                    "first light file is used as the output root directory.</p>" +
                    "<p>If a relative path is given then it will be appended " + 
                    "to the first light file path.</p>" +
                    "<p>If output directory is given with AutoContinue then output " + 
                    "goes to that directory and not into directory subtree.</p>" +
                    "<p>If directory does not exist it is created.</p>";
      var edt = new Edit( parent );
      edt.text = outputRootDir;
      edt.toolTip = lbl.toolTip;
      edt.onEditCompleted = function() {
            outputRootDir = ensurePathEndSlash(edt.text.trim());
            console.writeln("addOutputDir, set outputRootDir ", outputRootDir);
      };

      var dirbutton = new ToolButton( parent );
      dirbutton.icon = parent.scaledResource( ":/icons/select-file.png" );
      dirbutton.toolTip = "<p>Select output root directory.</p>";
      dirbutton.onClick = function() {
            var gdd = new GetDirectoryDialog;
            gdd.initialPath = outputRootDir;
            gdd.caption = "Select Output Directory";
            if (gdd.execute()) {
                  outputRootDir = ensurePathEndSlash(gdd.directory);
                  console.writeln("addOutputDir, set outputRootDir ", outputRootDir);
                  edt.text = outputRootDir;
            }
      };
      
      var outputdir_Sizer = new HorizontalSizer;
      outputdir_Sizer.spacing = 4;
      outputdir_Sizer.add( lbl );
      outputdir_Sizer.add( edt );
      outputdir_Sizer.add( dirbutton );

      return outputdir_Sizer;
}

function validateWindowPrefix(p)
{
      p = p.replace(/[^A-Za-z0-9]/gi,'_');
      p = p.replace(/_+$/,'');
      if (p.match(/^\d/)) {
            // if user tries to start prefix with a digit, prepend an underscore
            p = "_" + p;
      }
      return p;
}

// Update window prefix before using it.
// Moved from windowPrefixComboBox.onEditTextUpdated
// is that function is called for every character.
function updateWindowPrefix()
{
      ppar.win_prefix = validateWindowPrefix(ppar.win_prefix);
      windowPrefixComboBox.editText = ppar.win_prefix;
      if (ppar.win_prefix != "") {
            ppar.win_prefix = ppar.win_prefix + "_";
      }
      console.writeln("updateWindowPrefix, set winPrefix '" + ppar.win_prefix + "'");
      fixAllWindowArrays(ppar.win_prefix);
}

function addWinPrefix(parent)
{
      var lbl = new Label( parent );
      lbl.text = "Window Prefix";
      lbl.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      lbl.toolTip = "<p>Give window prefix identifier.</p>" +
                    "<p>If specified, all AutoIntegrate windows will be " +
                    "prepended with the prefix and an underscore.</p>" +
                    "<p>This makes all generated window names unique " +
                    "for the current run and allows you run multiple times " +
                    "without closing or manually renaming all the windows from previous runs, " +
                    "as long as you change the prefix before each run." +
                    "<p>The window prefix will be saved across script invocations " +
                    "for convenience with the AutoContinue function.</p>";
      
      windowPrefixComboBox = new ComboBox( parent );
      windowPrefixComboBox.enabled = true;
      windowPrefixComboBox.editEnabled = true;
      windowPrefixComboBox.minItemCharWidth = 10;
      windowPrefixComboBox.toolTip = lbl.toolTip;
      var pa = get_win_prefix_combobox_array(ppar.win_prefix);
      addArrayToComboBox(windowPrefixComboBox, pa);
      windowPrefixComboBox.editText = ppar.win_prefix;
      windowPrefixComboBox.onEditTextUpdated = function() {
            // This function is called for every character edit so actions
            // are moved to function updateWindowPrefix
            ppar.win_prefix = validateWindowPrefix(windowPrefixComboBox.editText.trim());
            windowPrefixComboBox.editText = ppar.win_prefix;
      };

      /*
      var edt = new Edit( parent );
      edt.text = ppar.win_prefix;
      edt.toolTip = lbl.toolTip;
      edt.onEditCompleted = function() {
            ppar.win_prefix = edt.text.trim();
            if (ppar.win_prefix != last_win_prefix) {
                  ppar.win_prefix = ppar.win_prefix.replace(/[^A-Za-z0-9]/gi,'_');
                  ppar.win_prefix = ppar.win_prefix.replace(/_+$/,'');
                  if (ppar.win_prefix.match(/^\d/)) {
                        // if user tries to start prefix with a digit, prepend an underscore
                        ppar.win_prefix = "_" + ppar.win_prefix;
                  }
                  if (ppar.win_prefix != "") {
                        ppar.win_prefix = ppar.win_prefix + "_";
                  }
                  fixAllWindowArrays(ppar.win_prefix);
                  last_win_prefix = ppar.win_prefix;
                  edt.text = ppar.win_prefix;

            }

            console.writeln("addWinPrefix, set winPrefix ", ppar.win_prefix);
      };
      */

      // Add help button to show known prefixes. Maybe this should be in
      // label and edit box toolTips.
      windowPrefixHelpTips = new ToolButton( parent );
      windowPrefixHelpTips.icon = parent.scaledResource( ":/icons/help.png" );
      windowPrefixHelpTips.setScaledFixedSize( 20, 20 );
      windowPrefixHelpTips.toolTip = "Current Window Prefixes:";

      var winprefix_Sizer = new HorizontalSizer;
      winprefix_Sizer.spacing = 4;
      winprefix_Sizer.add( lbl );
      winprefix_Sizer.add( windowPrefixComboBox );
      winprefix_Sizer.add( windowPrefixHelpTips );

      return winprefix_Sizer;
}

/* Read saved Json file info.
 */ 
function parseJsonFile(fname, lights_only)
{
      console.writeln("parseJsonFile " + fname + " lights_only " + lights_only);

      var jsonFile = File.openFileForReading(fname);
      if (!jsonFile.isOpen) {
            console.criticalln("Could not open file " + fname);
            return null;
      }
      var jsonStr = jsonFile.read(DataType_ByteArray, jsonFile.size);
      jsonFile.close();

      var saveInfo = JSON.parse(jsonStr);
      if (saveInfo == null) {
            console.criticalln("Could not parse Json data in file " + fname);
            return null;
      }
      if (saveInfo.version != 1 && saveInfo.version != 2) {
            console.criticalln("Incorrect version " +  saveInfo.version + " in file " + fname);
            return null;
      }
      
      if (saveInfo.version == 2) {
            // read parameter values
            getSettingsFromJson(saveInfo.settings);
      }

      var pagearray = [];
      for (var i = 0; i < pages.END; i++) {
            pagearray[i] = null;
      }
      var fileInfoList = saveInfo.fileinfo;
      var found_files = false;
      for (var i = 0; i < fileInfoList.length; i++) {
            var saveInfo = fileInfoList[i];
            console.writeln("parseJsonFile " + saveInfo.pagename);
            if (lights_only && saveInfo.pageindex != pages.LIGHTS) {
                  console.writeln("parseJsonFile, lights_only, skip");
                  continue;
            }
            if (saveInfo.files.length == 0) {
                  console.writeln("parseJsonFile, no files, skip");
                  continue;
            }
            found_files = true;
            pagearray[saveInfo.pageindex] = saveInfo.files;
            var filterSet = saveInfo.filterset;
            if (filterSet != null) {
                  switch (saveInfo.pageindex) {
                        case pages.LIGHTS:
                              console.writeln("parseJsonFile, set manual filters for lights");
                              lightFilterSet = filterSet;
                              break;
                        case pages.FLATS:
                              console.writeln("parseJsonFile, set manual filters for flats");
                              flatFilterSet = filterSet;
                              break;
                        default:
                              console.criticalln("Incorrect page index " +  saveInfo.pageindex + " for filter set in file " + fname);
                              return null;
                  }
            }
      }
      if (!found_files) {
            console.writeln("parseJsonFile, no files found");
            return null;
      }
      console.writeln("parseJsonFile, return files for pages");
      return pagearray;
}

function addJsonFileInfo(fileInfoList, pageIndex, treeboxfiles, filterset)
{
      var name = "";
      switch (pageIndex) {
            case pages.LIGHTS:
                  name = "Lights";
                  break;
            case pages.BIAS:
                  name = "Bias";
                  break;
            case pages.DARKS:
                  name = "Darks";
                  break;
            case pages.FLATS:
                  name = "Flats";
                  break;
            case pages.FLAT_DARKS:
                  name = "FlatDarks";
                  break;
      }
      fileInfoList[fileInfoList.length] = { pageindex: pageIndex, pagename: name, files: treeboxfiles, filterset: filterset };
}

function getChangedSettingsAsJson()
{
      var settings = [];
      console.writeln("getChangedSettingsAsJson");
      for (let x in par) {
            var param = par[x];
            if (param.val != param.def) {
                  console.writeln("getChangedSettingsAsJson, save " + param.name + "=" + param.val);
                  settings[settings.length] = [ param.name, param.val ];
            }
      }
      console.noteln("Saving " + settings.length + " settings");
      return settings;
}

function getSettingsFromJson(settings)
{

      if (settings == null || settings == undefined) {
            console.noteln("getSettingsFromJson: empty settings");
            return;
      }

      console.noteln("Restore " + settings.length + " settings");

      for (var i = 0; i < settings.length; i++) {
            for (let x in par) {
                  var param = par[x];
                  if (param.name == settings[i][0]) {
                        param.val = settings[i][1];
                        if (param.reset != undefined) {
                              param.reset();
                        }
                        console.writeln("getSettingsFromJson, save " + param.name + "=" + param.val);
                  }
            }
      }
}

function initJsonSaveInfo(fileInfoList, save_settings)
{
      if (save_settings) {
            var changed_settings = getChangedSettingsAsJson();
            return { version: 2, fileinfo: fileInfoList, settings: changed_settings };
      } else {
            return { version: 1, fileinfo: fileInfoList };
      }
}

/* Save file info to a file.
 */
function saveJsonFile(parent, save_settings)
{
      console.writeln("saveJsonFile");

      let fileInfoList = [];

      for (let pageIndex = 0; pageIndex < parent.treeBox.length; pageIndex++) {
            let treeBox = parent.treeBox[pageIndex];
            let treeboxfiles = [];
            let filterSet = null;
            let name = "";
            switch (pageIndex) {
                  case pages.LIGHTS:
                        name = "Lights";
                        filterSet = lightFilterSet;
                        break;
                  case pages.BIAS:
                        name = "Bias";
                        break;
                  case pages.DARKS:
                        name = "Darks";
                        break;
                  case pages.FLATS:
                        name = "Flats";
                        filterSet = flatFilterSet;
                        break;
                  case pages.FLAT_DARKS:
                        name = "FlatDarks";
                        break;
                  default:
                        name = "Unknown";
                        break;
            }

            if (treeBox.numberOfChildren == 0) {
                  continue;
            }

            console.writeln(name + " files");

            getTreeBoxNodeFiles(treeBox, treeboxfiles);

            console.writeln("Found " + treeboxfiles.length + " files");

            if (treeboxfiles.length == 0) {
                  // no files
                  continue;
            }

            if (filterSet != null) {
                  clearFilterFileUsedFlags(filterSet);
            }
            addJsonFileInfo(fileInfoList, pageIndex, treeboxfiles, filterSet);
      }

      if (fileInfoList.length == 0 && !save_settings) {
            // nothing to save
            console.writeln("No files to save.");
            return;
      }

      let saveInfo = initJsonSaveInfo(fileInfoList, save_settings);
      let saveInfoJson = JSON.stringify(saveInfo, null, 2);

      let saveFileDialog = new SaveFileDialog();
      saveFileDialog.caption = "Save As";
      saveFileDialog.filters = [["Json files", "*.json"], ["All files", "*.*"]];
      if (fileInfoList.length > 0) {
            var outputDir = ensurePathEndSlash(getOutputDir(fileInfoList[0].files[0][0]));
      } else {
            var outputDir = ensurePathEndSlash(getOutputDir(""));
      }
      if (save_settings) {
            saveFileDialog.initialPath = outputDir + "AutoSetup.json";
      } else {
            saveFileDialog.initialPath = outputDir + "AutoFiles.json";
      }
      if (!saveFileDialog.execute()) {
            return;
      }
      try {
            let file = new File();
            file.createForWriting(saveFileDialog.fileName);
            file.outTextLn(saveInfoJson);
            file.close();
            console.noteln("Saved to a file "+ saveFileDialog.fileName);
      } catch (error) {
            console.criticalln("Error: failed to write file "+ saveFileDialog.fileName);
            console.criticalln(error);
      }
}

function treeboxfilesToFilenames(treeboxfiles)
{
      var filenames = [];
      for (var i = 0; i < treeboxfiles.length; i++) {
            if (treeboxfiles[i][1]) {
                  // checked
                  filenames[filenames.length] = treeboxfiles[i][0];
            }
      }
      return filenames;
}

function filenamesToTreeboxfiles(treeboxfiles, filenames, checked)
{
      for (var i = 0; i < filenames.length; i++) {
            treeboxfiles[treeboxfiles.length] =  [ filenames[i], checked ];
      }
}

function getTreeBoxNodeFileCount(node)
{
      if (node.numberOfChildren == 0) {
            return 1;
      } else {
            var cnt = 0;
            for (var i = 0; i < node.numberOfChildren; i++) {
                  cnt = cnt + getTreeBoxNodeFileCount(node.child(i));
            }
            return cnt;
      }
}

function getTreeBoxFileCount(node)
{
      if (node.numberOfChildren == 0) {
            return 0;
      } else {
            return getTreeBoxNodeFileCount(node);
      }
}

function checkAllTreeBoxNodeFiles(node)
{
      if (node.numberOfChildren == 0) {
            node.checked = true;
      } else {
            for (var i = 0; i < node.numberOfChildren; i++) {
                  checkAllTreeBoxNodeFiles(node.child(i));
            }
      }
}
function checkAllTreeBoxFiles(node)
{
      if (node.numberOfChildren == 0) {
            return 0;
      } else {
            return checkAllTreeBoxNodeFiles(node);
      }
}

function getTreeBoxNodeFileNamesCheckedIf(node, filenames, checked)
{
      if (node.numberOfChildren == 0) {
            if (node.checked == checked) {
                  filenames[filenames.length] = node.text(0);
            }
      } else {
            for (var i = 0; i < node.numberOfChildren; i++) {
                  getTreeBoxNodeFileNamesCheckedIf(node.child(i), filenames, checked);
            }
      }
}

function getTreeBoxNodeFiles(node, treeboxfiles)
{
      if (node.numberOfChildren == 0) {
            treeboxfiles[treeboxfiles.length] = [ node.text(0), node.checked ];
      } else {
            for (var i = 0; i < node.numberOfChildren; i++) {
                  getTreeBoxNodeFiles(node.child(i), treeboxfiles);
            }
      }
}

function getTreeBoxNodeCheckedFileNames(node, filenames)
{
      if (node.numberOfChildren == 0) {
            if (node.checked) {
                  filenames[filenames.length] = node.text(0);
            }
      } else {
            for (var i = 0; i < node.numberOfChildren; i++) {
                  getTreeBoxNodeCheckedFileNames(node.child(i), filenames);
            }
      }
}

function setExpandedTreeBoxNode(node, expanded)
{
      if (node.numberOfChildren > 0) {
            for (var i = 0; i < node.numberOfChildren; i++) {
                  if (node.collapsable) {
                        node.expanded = expanded;
                  }
                  setExpandedTreeBoxNode(node.child(i), expanded);
            }
      }
}

function filterTreeBoxFiles(parent, pageIndex)
{
      console.show(true);
      var treebox = parent.treeBox[pageIndex];
      if (treebox.numberOfChildren == 0) {
            console.writeln("filterTreeBoxFiles, no files");
            return;
      }

      console.writeln("filterTreeBoxFiles " + pageIndex);

      var checked_files = [];
      var unchecked_files = [];

      getTreeBoxNodeFileNamesCheckedIf(treebox, checked_files, true);
      getTreeBoxNodeFileNamesCheckedIf(treebox, unchecked_files, false);

      var treeboxfiles = SubframeSelectorMeasure(checked_files, true, true);

      // add old unchecked files
      filenamesToTreeboxfiles(treeboxfiles, unchecked_files, false);

      console.writeln("filterTreeBoxFiles " + treeboxfiles.length + " files");

      // remove old files
      parent.treeBox[pageIndex].clear();

      // add new filtered file list
      addFilesToTreeBox(parent, pageIndex, treeboxfiles);

      console.writeln("filterTreeBoxFiles, addFilesToTreeBox done");

      var checked_count = 0;
      for (var i = 0; i < treeboxfiles.length; i++) {
            if (treeboxfiles[i][1]) {
                  checked_count++;
            }
      }

      console.noteln("AutoIntegrate filtering completed, " + checked_count + " checked, " + (treeboxfiles.length - checked_count) + " unchecked");
}

function getFilesFromTreebox(parent)
{
      for (var pageIndex = 0; pageIndex < parent.treeBox.length; pageIndex++) {
            console.writeln("getFilesFromTreebox " + pageIndex);
            var treeBox = parent.treeBox[pageIndex];
            if (treeBox.numberOfChildren == 0) {
                  var filenames = null;
            } else {
                  var filenames = [];
                  getTreeBoxNodeCheckedFileNames(treeBox, filenames);
            }

            switch (pageIndex) {
                  case pages.LIGHTS:
                        lightFileNames = filenames;
                        break;
                  case pages.BIAS:
                        biasFileNames = filenames;
                        break;
                  case pages.DARKS:
                        darkFileNames = filenames;
                        break;
                  case pages.FLATS:
                        flatFileNames = filenames;
                        break;
                  case pages.FLAT_DARKS:
                        flatdarkFileNames = filenames;
                        break;
                  default:
                        throwFatalError("getFilesFromTreebox bad pageIndex " + pageIndex);
            }
      }
}

function getNewTreeBoxFiles(parent, pageIndex, imageFileNames)
{
      console.writeln("getNewTreeBoxFiles " + pageIndex);

      var treeBox = parent.treeBox[pageIndex];
      var treeboxfiles = [];

      if (treeBox.numberOfChildren > 0) {
            getTreeBoxNodeFiles(treeBox, treeboxfiles);
      }

      for (var i = 0; i < imageFileNames.length; i++) {
            var obj = imageFileNames[i];
            if (Array.isArray(obj)) {
                  var filename = imageFileNames[i][0];
                  var checked = imageFileNames[i][1];
            } else {
                  var filename = imageFileNames[i];
                  var checked = true;
            }
            treeboxfiles[treeboxfiles.length] = [ filename, checked ];
      }
      return treeboxfiles;
}

function addFilteredFilesToTreeBox(parent, pageIndex, newImageFileNames)
{
      console.writeln("addFilteredFilesToTreeBox " + pageIndex);

      var treeboxfiles = getNewTreeBoxFiles(parent, pageIndex, newImageFileNames);

      var filteredFiles = getFilterFiles(treeboxfiles, pageIndex, '');
      var files_TreeBox = parent.treeBox[pageIndex];
      files_TreeBox.clear();

      var rootnode = new TreeBoxNode(files_TreeBox);
      rootnode.expanded = true;
      if (filteredFiles.error_text != "") {
            rootnode.useRichText = true;
            var errortxt = "Files grouped by filter: " + filteredFiles.error_text;
            var font = rootnode.font( 0 );
            font.bold = true
            rootnode.setFont( 0, font );
            rootnode.setText( 0, errortxt);
      } else {
            rootnode.setText( 0, "Files grouped by filter" );
      }
      rootnode.nodeData_type = "FrameGroup";
      rootnode.collapsable = false;

      files_TreeBox.canUpdate = false;

      console.writeln("addFilteredFilesToTreeBox " + filteredFiles.allfilesarr.length + " files");

      for (var i = 0; i < filteredFiles.allfilesarr.length; i++) {

            var filterFiles = filteredFiles.allfilesarr[i].files;
            var filterName = filteredFiles.allfilesarr[i].filter;

            if (filterFiles.length > 0) {
                  console.writeln("addFilteredFilesToTreeBox filterName " + filterName + ", " + filterFiles.length + " files");

                  var filternode = new TreeBoxNode(rootnode);
                  filternode.expanded = true;
                  filternode.setText( 0, filterName +  ' (' + filterFiles[0].filter + ') ' + filterFiles.length + ' files');
                  filternode.nodeData_type = "FrameGroup";
                  filternode.collapsable = true;

                  for (var j = 0; j < filterFiles.length; j++) {
                        var node = new TreeBoxNode(filternode);
                        node.setText(0, filterFiles[j].name);
                        node.nodeData_type = "";
                        node.checkable = true;
                        node.checked = filterFiles[j].checked;
                        node.collapsable = false;
                  }
            }
      }
      files_TreeBox.canUpdate = true;
}

function addUnfilteredFilesToTreeBox(parent, pageIndex, newImageFileNames)
{
      console.writeln("addUnfilteredFilesToTreeBox " + pageIndex);

      var files_TreeBox = parent.treeBox[pageIndex];
      files_TreeBox.clear();

      var treeboxfiles = getNewTreeBoxFiles(parent, pageIndex, newImageFileNames);

      files_TreeBox.canUpdate = false;
      for (var i = 0; i < treeboxfiles.length; i++) {
            var node = new TreeBoxNode(files_TreeBox);
            node.setText(0, treeboxfiles[i][0]);
            node.nodeData_type = "";
            node.checkable = true;
            node.checked = treeboxfiles[i][1];
            node.collapsable = false;
      }
      files_TreeBox.canUpdate = true;
}

function addFilesToTreeBox(parent, pageIndex, imageFileNames)
{
      switch (pageIndex) {
            case pages.LIGHTS:
            case pages.FLATS:
                  addFilteredFilesToTreeBox(parent, pageIndex, imageFileNames);
                  break;
            case pages.BIAS:
            case pages.DARKS:
            case pages.FLAT_DARKS:
                  addUnfilteredFilesToTreeBox(parent, pageIndex, imageFileNames);
                  break;
            default:
                  throwFatalError("addFilesToTreeBox bad pageIndex " + pageIndex);
      }
}

function loadJsonFile(parent)
{
      console.writeln("loadJsonFile");
      var pagearray = openImageFiles("Json", false, true);
      if (pagearray == null) {
            return;
      }
      // page array of treebox files names
      for (var i = 0; i < pagearray.length; i++) {
            if (pagearray[i] != null) {
                  addFilesToTreeBox(parent, i, pagearray[i]);
            }
      }
      updateInfoLabel(parent);
}

function addOneFilesButton(parent, filetype, pageIndex, toolTip)
{
      var filesAdd_Button = new PushButton( parent );
      filesAdd_Button.text = "Add " + filetype;
      filesAdd_Button.icon = parent.scaledResource( ":/icons/add.png" );
      filesAdd_Button.toolTip = toolTip;
      filesAdd_Button.onClick = function()
      {
            var pagearray = openImageFiles(filetype, false, false);
            if (pagearray == null) {
                  return;
            }
            if (pagearray.length == 1) {
                  // simple list of file names
                  var imageFileNames = pagearray[0];
                  if (pageIndex == pages.LIGHTS && !par.skip_autodetect_imagetyp.val) {
                        var imagetypes = getImagetypFiles(imageFileNames);
                        for (var i = 0; i < pages.END; i++) {
                              if (imagetypes[i].length > 0) {
                                    addFilesToTreeBox(parent, i, imagetypes[i]);
                              }
                        }
                  } else {
                        addFilesToTreeBox(parent, pageIndex, imageFileNames);
                  }
            } else {
                  // page array of treebox files names
                  for (var i = 0; i < pagearray.length; i++) {
                        if (pagearray[i] != null) {
                              addFilesToTreeBox(parent, i, pagearray[i]);
                        }
                  }
            }
            updateInfoLabel(parent);
            parent.tabBox.currentPageIndex = pageIndex;
      };
      return filesAdd_Button;
}

function addFilesButtons(parent)
{
      var addLightsButton = addOneFilesButton(parent, "Lights", pages.LIGHTS, parent.filesToolTip[pages.LIGHTS]);
      var addBiasButton = addOneFilesButton(parent, "Bias", pages.BIAS, parent.filesToolTip[pages.BIAS]);
      var addDarksButton = addOneFilesButton(parent, "Darks", pages.DARKS, parent.filesToolTip[pages.DARKS]);
      var addFlatsButton = addOneFilesButton(parent, "Flats", pages.FLATS, parent.filesToolTip[pages.FLATS]);
      var addFlatDarksButton = addOneFilesButton(parent, "Flat Darks", pages.FLAT_DARKS, parent.filesToolTip[pages.FLAT_DARKS]);

      var winprefix_sizer = addWinPrefix(parent);
      var outputdir_sizer = addOutputDir(parent);

      var filesButtons_Sizer = new HorizontalSizer;
      filesButtons_Sizer.spacing = 4;
      filesButtons_Sizer.add( addLightsButton );
      filesButtons_Sizer.add( addBiasButton );
      filesButtons_Sizer.add( addDarksButton );
      filesButtons_Sizer.add( addFlatsButton );
      filesButtons_Sizer.add( addFlatDarksButton );
      filesButtons_Sizer.addStretch();
      filesButtons_Sizer.add( winprefix_sizer );
      filesButtons_Sizer.add( outputdir_sizer );
      return filesButtons_Sizer;
}

function addOneFileManualFilterButton(parent, filetype, pageIndex)
{
      var filesAdd_Button = new PushButton( parent );
      filesAdd_Button.text = filetype;
      filesAdd_Button.icon = parent.scaledResource( ":/icons/add.png" );
      if (filetype == 'C') {
            filesAdd_Button.toolTip = "Add color/OSC/DSLR files";
      } else {
            filesAdd_Button.toolTip = "Add " + filetype + " files";
      }
      filesAdd_Button.onClick = function() {
            var imageFileNames = openImageFiles(filetype, true, false);
            if (imageFileNames != null) {
                  var filterSet;
                  switch (pageIndex) {
                        case pages.LIGHTS:
                              if (lightFilterSet == null) {
                                    lightFilterSet = initFilterSets();
                              }
                              filterSet = findFilterSet(lightFilterSet, filetype);
                              break;
                        case pages.FLATS:
                              if (flatFilterSet == null) {
                                    flatFilterSet = initFilterSets();
                              }
                              filterSet = findFilterSet(flatFilterSet, filetype);
                              break;
                        default:
                              throwFatalError("addOneFileManualFilterButton bad pageIndex " + pageIndex);
                  }
                  console.writeln("addOneFileManualFilterButton add " + filetype + " files");
                  for (var i = 0; i < imageFileNames.length; i++) {
                        addFilterSetFile(filterSet, imageFileNames[i], filetype);
                  }
                  addFilesToTreeBox(parent, pageIndex, imageFileNames);
                  updateInfoLabel(parent);
            }
      };
      return filesAdd_Button;
}

function addFileFilterButtons(parent, pageIndex)
{
      var buttonsControl = new Control(parent);
      buttonsControl.sizer = new HorizontalSizer;
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'L', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'R', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'G', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'B', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'H', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'S', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'O', pageIndex));
      buttonsControl.sizer.add(addOneFileManualFilterButton(parent, 'C', pageIndex));
      buttonsControl.visible = false;
      return buttonsControl;
}

function addFileFilterButtonSectionBar(parent, pageIndex)
{
      var control = addFileFilterButtons(parent, pageIndex);

      var sb = new SectionBar(parent, "Add filter files manually");
      sb.setSection(control);
      sb.hide();
      sb.toolTip = "Select manually files for each filter. Useful if filters are not recognized automatically.";
      sb.onToggleSection = function(bar, beginToggle){
            parent.dialog.adjustToContents();
      };

      filterSectionbars[pageIndex] = sb;
      filterSectionbarcontrols[pageIndex] = control;

      var gb = new Control( parent );
      gb.sizer = new VerticalSizer;
      gb.sizer.add( sb );
      gb.sizer.add( control );

      return gb;
}

function filesTreeBox(parent, optionsSizer, pageIndex)
{
      /* Tree box to show files. */
      var files_TreeBox = new TreeBox( parent );
      files_TreeBox.multipleSelection = true;
      files_TreeBox.rootDecoration = false;
      files_TreeBox.alternateRowColor = true;
      files_TreeBox.setScaledMinSize( 300, 150 );
      files_TreeBox.numberOfColumns = 1;
      files_TreeBox.headerVisible = false;
      files_TreeBox.onCurrentNodeUpdated = () =>
      {
            if (par.skip_blink.val) {
                  return;
            }
            try {
                  if (files_TreeBox.currentNode != null && files_TreeBox.currentNode.nodeData_type == "") {
                        // Show "blink" window. 
                        // Note: Files are added by routine addFilteredFilesToTreeBox
                        console.hide();
                        var imageWindows = ImageWindow.open(files_TreeBox.currentNode.text( 0 ));
                        if (imageWindows == null || imageWindows.length != 1) {
                              return;
                        }
                        var imageWindow = imageWindows[0];
                        if (blink_window != null) {
                              imageWindow.position = blink_window.position;
                        } else {
                              imageWindow.position = new Point(0, 0);
                        }
                        runHistogramTransformSTFex(imageWindow, null, imageWindow.mainView.image.isColor, DEFAULT_AUTOSTRETCH_TBGND, false);
                        if (blink_zoom) {
                              imageWindow.zoomFactor = 1;      
                        }
                        imageWindow.show();
                        if (blink_window != null) {
                              blink_window.forceClose();
                        }
                        blink_window = imageWindow;
                  }
            } catch(err) {
                  console.show(true);
                  console.criticalln(err);
            }
      }
      parent.treeBox[pageIndex] = files_TreeBox;

      var filesControl = new Control(parent);
      filesControl.sizer = new VerticalSizer;
      filesControl.sizer.add(files_TreeBox);
      filesControl.sizer.addSpacing( 4 );
      filesControl.sizer.add(newPageButtonsSizer(parent));
      if (pageIndex == pages.LIGHTS || pageIndex == pages.FLATS) {
            filesControl.sizer.add(addFileFilterButtonSectionBar(parent, pageIndex));
      }

      var files_GroupBox = new GroupBox( parent );
      //files_GroupBox.title = "Images";
      files_GroupBox.sizer = new HorizontalSizer;
      files_GroupBox.sizer.margin = 6;
      files_GroupBox.sizer.spacing = 4;
      files_GroupBox.sizer.add( filesControl, parent.textEditWidth );
      files_GroupBox.sizer.add( optionsSizer );

      return files_GroupBox;
}

function appendInfoTxt(txt, cnt, type)
{
      if (cnt == 0) {
            return txt;
      }
      var newtxt = cnt + " " + type + " files";
      if (txt == "") {
            return newtxt;
      } else {
            return txt + ", " + newtxt;
      }
}

function updateInfoLabel(parent)
{
      saved_measurements = null;    // files changed, we need to make new measurements

      var txt = "";
      txt = appendInfoTxt(txt, getTreeBoxFileCount(parent.treeBox[pages.LIGHTS]), "light");
      txt = appendInfoTxt(txt, getTreeBoxFileCount(parent.treeBox[pages.BIAS]), "bias");
      txt = appendInfoTxt(txt, getTreeBoxFileCount(parent.treeBox[pages.DARKS]), "dark");
      txt = appendInfoTxt(txt, getTreeBoxFileCount(parent.treeBox[pages.FLATS]), "flat");
      txt = appendInfoTxt(txt, getTreeBoxFileCount(parent.treeBox[pages.FLAT_DARKS]), "flat dark");

      console.writeln(txt);

      infoLabel.text = txt;
}

function mapBadChars(str)
{
      str = str.replace(/ /g,"_");
      str = str.replace(/-/g,"_");
      str = str.replace(/,/g,"_");
      return str;
}

// Write default parameters to process icon
function saveParametersToProcessIcon()
{
      console.writeln("saveParametersToProcessIcon");
      for (let x in par) {
            var param = par[x];
            if (param.val != param.def) {
                  var name = mapBadChars(param.name);
                  console.writeln(name + "=" + param.val);
                  Parameters.set(name, param.val);
            }
      }
}

// Read default parameters from process icon
function readParametersFromProcessIcon() 
{
      console.writeln("readParametersFromProcessIcon");
      for (let x in par) {
            var param = par[x];
            var name = mapBadChars(param.name);
            if (Parameters.has(name)) {
                  switch (param.type) {
                        case 'S':
                              param.val = Parameters.getString(name);
                              console.writeln(name + "=" + param.val);
                              break;
                        case 'B':
                              param.val = Parameters.getBoolean(name);
                              console.writeln(name + "=" + param.val);
                              break;
                        case 'I':
                              param.val = Parameters.getInteger(name);
                              console.writeln(name + "=" + param.val);
                              break;
                        case 'R':
                              param.val = Parameters.getReal(name);
                              console.writeln(name + "=" + param.val);
                              break;
                        default:
                              throwFatalError("Unknown type '" + param.type + '" for parameter ' + name);
                              break;
                  }
            }
      }
}

function setParameterDefaults()
{
      console.writeln("setParameterDefaults");
      for (let x in par) {
            var param = par[x];
            param.val = param.def;
            if (param.reset != undefined) {
                  param.reset();
            }
      }
}

// Save default parameters to persistent module settings
function saveParametersToPersistentModuleSettings()
{
      console.writeln("saveParametersToPersistentModuleSettings");
      for (let x in par) {
            var param = par[x];
            var name = SETTINGSKEY + '/' + mapBadChars(param.name);
            if (param.val != param.def) {
                  // not a default value, save setting
                  console.writeln("AutoIntegrate: save to settings " + name + "=" + param.val);
                  switch (param.type) {
                        case 'S':
                              Settings.write(name, DataType_String, param.val);
                              break;
                        case 'B':
                              Settings.write(name, DataType_Boolean, param.val);
                              break;
                        case 'I':
                              Settings.write(name, DataType_Int32, param.val);
                              break;
                        case 'R':
                              Settings.write(name, DataType_Real32, param.val);
                              break;
                        default:
                              throwFatalError("Unknown type '" + param.type + '" for parameter ' + name);
                              break;
                  }
            } else {
                  // default value, remove possible setting
                  Settings.remove(name);
            }
      }
}

// Read default parameters from persistent module settings
function ReadParametersFromPersistentModuleSettings()
{
      console.writeln("ReadParametersFromPersistentModuleSettings");
      for (let x in par) {
            var param = par[x];
            var name = SETTINGSKEY + '/' + mapBadChars(param.name);
            switch (param.type) {
                  case 'S':
                        var tempSetting = Settings.read(name, DataType_String);
                        break;
                  case 'B':
                        var tempSetting = Settings.read(name, DataType_Boolean);
                        break;
                  case 'I':
                        var tempSetting = Settings.read(name, DataType_Int32);
                        break;
                  case 'R':
                        var tempSetting = Settings.read(name, DataType_Real32);
                        break;
                  default:
                        throwFatalError("Unknown type '" + param.type + '" for parameter ' + name);
                        break;
            }
            if (Settings.lastReadOK) {
                  console.writeln("AutoIntegrate: read from settings " + name + "=" + tempSetting);
                  param.val = tempSetting;
            }
      }
}

function printProcessDefaultValues(name, obj)
{
      console.writeln(name);
      console.writeln(obj.toSource());
}

function newPageButtonsSizer(parent)
{
      // Blink
      var blinkLabel = new Label( parent );
      blinkLabel.text = "Blink";
      blinkLabel.toolTip = "Blink zoom control";
      blinkLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;

      var blinkFitButton = new ToolButton( parent );
      blinkFitButton.icon = parent.scaledResource(":/toolbar/view-zoom-optimal-fit.png");
      blinkFitButton.toolTip = "Blink window zoom to optimal fit";
      blinkFitButton.setScaledFixedSize( 20, 20 );
      blinkFitButton.onClick = function()
      {
            if (par.skip_blink.val) {
                  return;
            }
            if (blink_window != null) {
                  blink_window.zoomToOptimalFit();
                  blink_zoom = false;
            }
      };
      var blinkZoomButton = new ToolButton( parent );
      blinkZoomButton.icon = parent.scaledResource(":/icons/zoom-1-1.png");
      blinkZoomButton.toolTip = "Blink window zoom to 1:1";
      blinkZoomButton.setScaledFixedSize( 20, 20 );
      blinkZoomButton.onClick = function()
      {
            if (par.skip_blink.val) {
                  return;
            }
            if (blink_window != null) {
                  blink_window.zoomFactor = 1;
                  blink_zoom = true;
            }
      };

      // Load and save
      var jsonLabel = new Label( parent );
      jsonLabel.text = "File list";
      jsonLabel.toolTip = "File list loading and saving.";
      jsonLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;

      var jsonLoadButton = new ToolButton( parent );
      jsonLoadButton.icon = parent.scaledResource(":/icons/select-file.png");
      jsonLoadButton.toolTip = "Load file lists from a Json file.";
      jsonLoadButton.setScaledFixedSize( 20, 20 );
      jsonLoadButton.onClick = function()
      {
            loadJsonFile(parent.dialog);
      };
      var jsonSaveButton = new ToolButton( parent );
      jsonSaveButton.icon = parent.scaledResource(":/icons/save.png");
      jsonSaveButton.toolTip = "<p>Save file lists to a Json file including checked status.</p><p>Images from all pages are saved including light and calibration files.</p>";
      jsonSaveButton.setScaledFixedSize( 20, 20 );
      jsonSaveButton.onClick = function()
      {
            saveJsonFile(parent.dialog, false);
      };
      var jsonSaveWithSewttingsButton = new ToolButton( parent );
      jsonSaveWithSewttingsButton.icon = parent.scaledResource(":/toolbar/file-project-save.png");
      jsonSaveWithSewttingsButton.toolTip = "<p>Save file lists and current settings to a Json file including checked status.</p><p>Images from all pages are saved including light and calibration files.</p>";
      jsonSaveWithSewttingsButton.setScaledFixedSize( 20, 20 );
      jsonSaveWithSewttingsButton.onClick = function()
      {
            saveJsonFile(parent.dialog, true);
      };
      
      var currentPageLabel = new Label( parent );
      currentPageLabel.text = "Current page";
      currentPageLabel.toolTip = "Operations on the current page.";
      currentPageLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;

      var currentPageCheckButton = new ToolButton( parent );
      currentPageCheckButton.icon = parent.scaledResource(":/icons/check.png");
      currentPageCheckButton.toolTip = "Mark all files in the current page as checked.";
      currentPageCheckButton.setScaledFixedSize( 20, 20 );
      currentPageCheckButton.onClick = function()
      {
            checkAllTreeBoxFiles(parent.dialog.treeBox[parent.dialog.tabBox.currentPageIndex]);
      };
      var currentPageClearButton = new ToolButton( parent );
      currentPageClearButton.icon = parent.scaledResource(":/icons/clear.png");
      currentPageClearButton.toolTip = "Clear the list of input images in the current page.";
      currentPageClearButton.setScaledFixedSize( 20, 20 );
      currentPageClearButton.onClick = function()
      {
            var pageIndex = parent.tabBox.currentPageIndex;
            parent.treeBox[pageIndex].clear();
            updateInfoLabel(parent);
      };
      var currentPageCollapseButton = new ToolButton( parent );
      currentPageCollapseButton.icon = parent.scaledResource(":/browser/collapse.png");
      currentPageCollapseButton.toolTip = "Collapse all sections in the current page.";
      currentPageCollapseButton.setScaledFixedSize( 20, 20 );
      currentPageCollapseButton.onClick = function()
      {
            setExpandedTreeBoxNode(parent.dialog.treeBox[parent.dialog.tabBox.currentPageIndex], false);
      };
      var currentPageExpandButton = new ToolButton( parent );
      currentPageExpandButton.icon = parent.scaledResource(":/browser/expand.png");
      currentPageExpandButton.toolTip = "Expand all sections in the current page.";
      currentPageExpandButton.setScaledFixedSize( 20, 20 );
      currentPageExpandButton.onClick = function()
      {
            setExpandedTreeBoxNode(parent.dialog.treeBox[parent.dialog.tabBox.currentPageIndex], true);
      };
      var currentPageFilterButton = new ToolButton( parent );
      currentPageFilterButton.icon = parent.scaledResource(":/icons/filter.png");
      currentPageFilterButton.toolTip = "Filter and sort files based on current weighting and filtering settings. Only checked files are used. " +
                                      "Without any filtering rules files are just sorted by SSWEIGHT.";
      currentPageFilterButton.setScaledFixedSize( 20, 20 );
      currentPageFilterButton.onClick = function()
      {
            filterTreeBoxFiles(parent.dialog, parent.dialog.tabBox.currentPageIndex);
      };
      
      var buttonsSizer = new HorizontalSizer;

      buttonsSizer.margin = 4;

      buttonsSizer.add( blinkLabel );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( blinkFitButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( blinkZoomButton );

      buttonsSizer.addSpacing( 20 );
      buttonsSizer.add( jsonLabel );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( jsonLoadButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( jsonSaveButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( jsonSaveWithSewttingsButton );

      buttonsSizer.addSpacing( 20 );
      buttonsSizer.add( currentPageLabel );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( currentPageCheckButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( currentPageClearButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( currentPageCollapseButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( currentPageExpandButton );
      buttonsSizer.addSpacing( 4 );
      buttonsSizer.add( currentPageFilterButton );
      buttonsSizer.addStretch();

      return buttonsSizer;
}

function getProcessDefaultValues()
{
      write_processing_log_file = true;
      printProcessDefaultValues("new ChannelExtraction", new ChannelExtraction);
      printProcessDefaultValues("new ImageIntegration", new ImageIntegration);
      printProcessDefaultValues("new Superbias", new Superbias);
      printProcessDefaultValues("new ImageCalibration", new ImageCalibration);
      printProcessDefaultValues("new IntegerResample", new IntegerResample);
      printProcessDefaultValues("new CosmeticCorrection", new CosmeticCorrection);
      printProcessDefaultValues("new SubframeSelector", new SubframeSelector);
      printProcessDefaultValues("new PixelMath", new PixelMath);
      printProcessDefaultValues("new StarXTerminator", new StarXTerminator);
      printProcessDefaultValues("new StarNet", new StarNet);
      printProcessDefaultValues("new StarAlignment", new StarAlignment);
      printProcessDefaultValues("new LocalNormalization", new LocalNormalization);
      printProcessDefaultValues("new LinearFit", new LinearFit);
      printProcessDefaultValues("new DrizzleIntegration", new DrizzleIntegration);
      printProcessDefaultValues("new AutomaticBackgroundExtractor", new AutomaticBackgroundExtractor);
      printProcessDefaultValues("new ScreenTransferFunction", new ScreenTransferFunction);
      printProcessDefaultValues("new HistogramTransformation", new HistogramTransformation);
      printProcessDefaultValues("new MaskedStretch", new MaskedStretch);
      printProcessDefaultValues("new ACDNR", new ACDNR);
      printProcessDefaultValues("new MultiscaleLinearTransform", new MultiscaleLinearTransform);
      printProcessDefaultValues("new TGVDenoise", new TGVDenoise);
      printProcessDefaultValues("new BackgroundNeutralization", new BackgroundNeutralization);
      printProcessDefaultValues("new ColorCalibration", new ColorCalibration);
      printProcessDefaultValues("new ColorSaturation", new ColorSaturation);
      printProcessDefaultValues("new CurvesTransformation", new CurvesTransformation);
      printProcessDefaultValues("new LRGBCombination", new LRGBCombination);
      printProcessDefaultValues("new SCNR", new SCNR);
      printProcessDefaultValues("new Debayer", new Debayer);
      printProcessDefaultValues("new ChannelCombination", new ChannelCombination);
      printProcessDefaultValues("new ChannelExtraction", new ChannelExtraction);
      printProcessDefaultValues("new Invert", new Invert);
      printProcessDefaultValues("new StarMask", new StarMask);
      printProcessDefaultValues("new HDRMultiscaleTransform", new HDRMultiscaleTransform);
      printProcessDefaultValues("new LocalHistogramEqualization", new LocalHistogramEqualization);
      printProcessDefaultValues("new MorphologicalTransformation", new MorphologicalTransformation);
}

function newSectionBar(parent, control, title)
{
      var sb = new SectionBar(parent, title);
      sb.setSection(control);
      sb.onToggleSection = function(bar, beginToggle){
            parent.dialog.adjustToContents();
      };

      var gb = new newGroupBox( parent );
      gb.sizer = new VerticalSizer;
      gb.sizer.margin = 6;
      gb.sizer.spacing = 4;
      gb.sizer.add( sb );
      gb.sizer.add( control );

      return gb;
}

function newSectionBarAdd(parent, groupbox, control, title)
{
      var sb = new SectionBar(parent, title);
      sb.setSection(control);
      sb.onToggleSection = function(bar, beginToggle){
            parent.dialog.adjustToContents();
      };

      groupbox.sizer.add( sb );
      groupbox.sizer.add( control );
}

function exitFromDialog()
{
      console.show(true);
      if (blink_window != null) {
            blink_window.forceClose();
            blink_window = null;
      }
}

function AutoIntegrateDialog()
{
      this.__base__ = Dialog;
      this.__base__();

      var labelWidth1 = this.font.width( "Output format hints:" + 'T' );
      this.textEditWidth = 25 * this.font.width( "M" );
      this.numericEditWidth = 6 * this.font.width( "0" );

      var mainHelpTips = 
      "<p>" +
      "<b>AutoIntegrate - Automatic image integration utility</b>" +
      "</p><p>" +
      "Script automates initial steps of image processing in PixInsight. "+ 
      "It can calibrate images or it can be used with already calibrated images. "+ 
      "Most often you get the best results by running the script with default " +
      "settings and then continue processing in PixInsight." +
      "</p><p>"+
      "By default output files goes to the following subdirectories:<br>" +
      "- AutoOutput contains intermediate files generated during processing<br>" +
      "- AutoMaster contains generated master calibration files<br>" +
      "- AutoCalibrated contains calibrated light files<br>" +
      "- AutoProcessed contains processed final images. Also integrated images and log output is here." +
      "</p><p>" +
      "User can give output root directory which can be relative or absolute path." +
      "</p><p>"+
      "Always remember to check you data with Blink tool and remove all bad images." +
      "</p><p>" +
      "Batch mode is intended to be used with mosaic images. In Batch mode script " +
      "automatically asks files for the next mosaic panel. All mosaic panels are left open " +
      "and can be saved with Save batch result files buttons." +
      "</p><p>" +
      "When using color/OSC/RAW files it is recommended to set Pure RAW in PixInsight settings." +
      "</p><p>" +
      "For more details see:<br>" +
      "https://ruuth.xyz/AutoIntegrateInfo.html" +
      "</p><p>" +
      "This product is based on software from the PixInsight project, developed " +
      "by Pleiades Astrophoto and its contributors (https://pixinsight.com/)." +
      "</p><p>" +
      "Copyright (c) 2018-2021 Jarmo Ruuth<br>" +
      "Copyright (c) 2021 rob pfile<br>" +
      "Copyright (c) 2019 Vicent Peris<br>" +
      "Copyright (c) 2003-2020 Pleiades Astrophoto S.L." +
      "</p>";

      this.helpTips = new ToolButton( this );
      this.helpTips.icon = this.scaledResource( ":/icons/help.png" );
      this.helpTips.setScaledFixedSize( 20, 20 );
      this.helpTips.toolTip = mainHelpTips;

      this.filesToolTip = [];
      this.filesToolTip[pages.LIGHTS] = "<p>Add light files. If only lights are added " + 
                             "they are assumed to be already calibrated.</p>" +
                             "<p>If IMAGETYP is set on images script tries to automatically detect "+
                             "bias, dark flat and flat dark images. This can be disabled with No autodetect option.</p>";
      this.filesToolTip[pages.BIAS] = "<p>Add bias files. If only one file is added " + 
                             "it is assumed to be a master file.</p>";
      this.filesToolTip[pages.DARKS] = "<p>Add dark files. If only one file is added " + 
                             "it is assumed to be a master file.</p>";
      this.filesToolTip[pages.FLATS] = "<p>Add flat files. If only one file is added " + 
                             "it is assumed to be a master file.</p>";
      this.filesToolTip[pages.FLAT_DARKS] = "<p>Add flat dark image files. If only one file is added " + 
                             "it is assumed to be a master file. If flat dark files are selected " + 
                             "then master flat dark is used instead of master bias and master dark " + 
                             "is not used to calibrate flats.</p>";

      this.treeBox = [];
      this.filesButtonsSizer = addFilesButtons(this);

      this.tabBox = new TabBox( this );
      this.tabBox.addPage( new filesTreeBox( this, lightsOptions(this), pages.LIGHTS ), "Lights" );
      this.tabBox.addPage( new filesTreeBox( this, biasOptions(this), pages.BIAS ), "Bias" );
      this.tabBox.addPage( new filesTreeBox( this, darksOptions(this), pages.DARKS ), "Darks" );
      this.tabBox.addPage( new filesTreeBox( this, flatsOptions(this), pages.FLATS ), "Flats" );
      this.tabBox.addPage( new filesTreeBox( this, flatdarksOptions(this), pages.FLAT_DARKS ), "Flat Darks" );

      /* Parameters check boxes. */
      this.useLocalNormalizationCheckBox = newCheckBox(this, "Local Normalization", par.local_normalization, 
            "<p>Use local normalization data for ImageIntegration</p>" );
      this.FixColumnDefectsCheckBox = newCheckBox(this, "Fix column defects", par.fix_column_defects, 
            "If checked, fix linear column defects by using linear defect detection algorithm from LinearDefectDetection.js script. " + 
            "Defect information is used by CosmeticCorrection to fix the defects." );
      this.FixRowDefectsCheckBox = newCheckBox(this, "Fix row defects", par.fix_row_defects, 
            "If checked, fix linear row defects by using linear defect detection algorithm from LinearDefectDetection.js script. " + 
            "Defect information is used by CosmeticCorrection to fix the defects." );
      this.CosmeticCorrectionCheckBox = newCheckBox(this, "No CosmeticCorrection", par.skip_cosmeticcorrection, 
            "<p>Do not run CosmeticCorrection on image files</p>" );
      this.SubframeSelectorCheckBox = newCheckBox(this, "No SubframeSelector", par.skip_subframeselector, 
            "<p>Do not run SubframeSelector to get image weights</p>" );
      this.CalibrateOnlyCheckBox = newCheckBox(this, "Calibrate only", par.calibrate_only, 
            "<p>Run only image calibration</p>" );
      this.IntegrateOnlyCheckBox = newCheckBox(this, "Integrate only", par.integrate_only, 
            "<p>Run only image integration to create L,R,G,B or RGB files</p>" );
      this.imageWeightTestingCheckBox = newCheckBox(this, "Image weight testing ", par.image_weight_testing, 
            "<p>Run only SubframeSelector to output image weight information and outlier filtering into AutoIntegrate.log AutoWeights.json. " +
            "Json file can be loaded as input file list.</p>" +
            "<p>With this option no output image files are written.</p>" );
      this.ChannelCombinationOnlyCheckBox = newCheckBox(this, "ChannelCombination only", par.channelcombination_only, 
            "<p>Run only channel combination to linear RGB file. No autostretch or color calibration.</p>" );
      this.relaxedStartAlignCheckBox = newCheckBox(this, "Strict StarAlign", par.strict_StarAlign, 
            "<p>Use more strict StarAlign par. When set more files may fail to align.</p>" );
      this.keepIntegratedImagesCheckBox = newCheckBox(this, "Keep integrated images", par.keep_integrated_images, 
            "<p>Keep integrated images when closing all windows</p>" );
      this.keepTemporaryImagesCheckBox = newCheckBox(this, "Keep temporary images", par.keep_temporary_images, 
            "<p>Keep temporary images created while processing and do not close them. They will have tmp_ prefix.</p>" );
      this.ABE_before_channel_combination_CheckBox = newCheckBox(this, "Use ABE on channel images", par.ABE_before_channel_combination, 
            "<p>Use AutomaticBackgroundExtractor on L, R, G and B images separately before channels are combined.</p>" );
      this.ABE_on_lights_CheckBox = newCheckBox(this, "Use ABE on light images", par.ABE_on_lights, 
            "<p>Use AutomaticBackgroundExtractor on all light images. It is run very early in the processing before cosmetic correction.</p>" );
      this.useABE_L_RGB_CheckBox = newCheckBox(this, "Use ABE on combined images", par.use_ABE_on_L_RGB, 
            "<p>Use AutomaticBackgroundExtractor on L and RGB images. This is the Use ABE option.</p>" );
      this.remove_stars_early_CheckBox = newCheckBox(this, "Remove stars early", par.remove_stars_early, 
            "<p>NOTE! This option does not work correctly with linear images. This should be used " + 
            "only for narrowband images when they are stretched to non-linear state before combining. " + 
            "StarXTerminator should be able to handle linear images but in my tests it did not work from " + 
            "a script although it worked when used directly.</p>" + 
            "<p>With LRGB images remove stars from L, R, G and B images separately before channels are " + 
            "combined and while images are still in linear stage. This needs StarXTerminator.</p>" +
            "<p>With color images (DSLR/OSC) remove stars while image is still in linear stage. " + 
            "This needs StarXTerminator.</p>" +
            "<p>With narrowband images remove stars before narrowband mapping. With StarNet this needs " + 
            "non-linear data so that images are stretched to non-linear state. With StarXTerminator stars " + 
            "can be removed in linear state.");
      this.color_calibration_before_ABE_CheckBox = newCheckBox(this, "Color calibration before ABE", par.color_calibration_before_ABE, 
            "<p>Run ColorCalibration before AutomaticBackgroundExtractor in run on RGB image</p>" );
      this.use_background_neutralization_CheckBox = newCheckBox(this, "Use BackgroundNeutralization", par.use_background_neutralization, 
            "<p>Run BackgroundNeutralization before ColorCalibration</p>" );
      this.batch_mode_CheckBox = newCheckBox(this, "Batch mode", par.batch_mode, 
            "<p>Run in batch mode, continue until no files are given.</p>" +
            "<p>Batch mode is intended for processing mosaic panels. When one set of files " + 
            "is processed, batch mode will automatically ask for the next set of files. " + 
            "In batch mode only final image windows are left visible. </p>" +
            "<p>Final images are renamed using the subdirectory name. It is " + 
            "recommended that each part of the batch is stored in a separate directory. </p>");
      this.autodetect_imagetyp_CheckBox = newCheckBox(this, "Do not use IMAGETYP keyword", par.skip_autodetect_imagetyp, 
            "<p>If selected do not try to autodetect calibration files based on IMAGETYP keyword.</p>" );
      this.autodetect_filter_CheckBox = newCheckBox(this, "Do not use FILTER keyword", par.skip_autodetect_filter, 
            "<p>If selected do not try to autodetect light and flat files based on FILTER keyword.</p>" +
            "<p>Selecting this enables manual adding of filter files for lights and flats.</p>" );
      this.autodetect_filter_CheckBox.onClick = function(checked) { 
            par.skip_autodetect_filter.val = checked; 
            showOrHideFilterSectionBar(pages.LIGHTS);
            showOrHideFilterSectionBar(pages.FLATS);
      }
      this.select_all_files_CheckBox = newCheckBox(this, "Select all files", par.select_all_files, 
            "<p>If selected default file select pattern is all files (*.*) and not image files.</p>" );
      this.save_all_files_CheckBox = newCheckBox(this, "Save all files", par.save_all_files, 
            "<p>If selected save buttons will save all processed and iconized files and not just final image files. </p>" );
      this.no_subdirs_CheckBox = newCheckBox(this, "No subdirectories", par.no_subdirs, 
            "<p>If selected output files are not written into subdirectories</p>" );
      this.no_subdirs_CheckBox.onClick = function(checked) { 
            par.no_subdirs.val = checked;
            if (par.no_subdirs.val) {
                  clearDefaultDirs();
            } else {
                  setDefaultDirs();
            }
      }
      this.use_drizzle_CheckBox = newCheckBox(this, "Drizzle", par.use_drizzle, 
            "<p>Use Drizzle integration</p>" );
      this.monochrome_image_CheckBox = newCheckBox(this, "Monochrome", par.monochrome_image, 
            "<p>Create a monochrome image. All images are treated as Luminance files and stacked together. " + 
            "Quite a few processing steps are skipped with this option.</p>" );
      this.imageintegration_ssweight_CheckBox = newCheckBox(this, "ImageIntegration use ssweight", par.use_imageintegration_ssweight, 
            "<p>Use SSWEIGHT weight keyword during ImageIntegration.</p>" );
      this.imageintegration_clipping_CheckBox = newCheckBox(this, "No ImageIntegration clipping", par.skip_imageintegration_clipping, 
            "<p>Do not use clipping in ImageIntegration</p>" );
      this.RRGB_image_CheckBox = newCheckBox(this, "RRGB image", par.RRGB_image, 
            "<p>RRGB image using R as Luminance.</p>" );
      this.synthetic_l_image_CheckBox = newCheckBox(this, "Synthetic L image", par.synthetic_l_image, 
            "<p>Create synthetic L image from all light images.</p>" );
      this.synthetic_missing_images_CheckBox = newCheckBox(this, "Synthetic missing image", par.synthetic_missing_images, 
            "<p>Create synthetic image for any missing image.</p>" );
      this.force_file_name_filter_CheckBox = newCheckBox(this, "Use file name for filters", par.force_file_name_filter, 
            "<p>Use file name for recognizing filters and ignore FILTER keyword.</p>" );
      this.unique_file_names_CheckBox = newCheckBox(this, "Use unique file names", par.unique_file_names, 
            "<p>Use unique file names by adding a timestamp when saving to disk.</p>" );
      this.skip_noise_reduction_CheckBox = newCheckBox(this, "No noise reduction", par.skip_noise_reduction, 
            "<p>Do not use noise reduction. More fine grained noise reduction settings can be found in the Processing settings section.</p>" );
      this.no_mask_contrast_CheckBox = newCheckBox(this, "No extra contrast on mask", par.skip_mask_contrast, 
            "<p>Do not add extra contrast on automatically created luminance mask.</p>" );
      this.no_sharpening_CheckBox = newCheckBox(this, "No sharpening", par.skip_sharpening, 
            "<p>Do not use sharpening on image. Sharpening uses a luminance and star mask to target light parts of the image.</p>" );
      this.skip_color_calibration_CheckBox = newCheckBox(this, "No color calibration", par.skip_color_calibration, 
            "<p>Do not run color calibration. Color calibration is run by default on RGB data.</p>" );
      this.use_starxterminator_CheckBox = newCheckBox(this, "Use StarXTerminator", par.use_starxterminator, 
            "<p>Use StarXTerminator instead of StarNet to remove stars from an image.</p>" );
      this.win_prefix_to_log_files_CheckBox = newCheckBox(this, "Add window prefix to log files", par.win_prefix_to_log_files, 
            "<p>Add window prefix to AutoIntegrate.log and AutoContinue.log files.</p>" );
      this.start_from_imageintegration_CheckBox = newCheckBox(this, "Start from ImageIntegration", par.start_from_imageintegration, 
            "<p>Start processing from ImageIntegration. File list should include star aligned files (*_r.xisf).</p>" +
            "<p>This option can be useful for testing different processing like Local Normalization or Drizzle " + 
            "(if Generate .xdrz files is selected). This is also useful if there is a need to manually remove " + 
            "bad files after alignment.</p>" +
            "<p>If filter type is not included in the file keywords it cannot be detected from the file name. In that case " + 
            "filter files must be added manually to the file list.</p>" );
      this.generate_xdrz_CheckBox = newCheckBox(this, "Generate .xdrz files", par.generate_xdrz, 
            "<p>Generate .xdrz files even if Drizzle integration is not used. It is useful if you want to try Drizzle " + 
            "integration later with Start from ImageIntegration option.</p>" );
      this.blink_checkbox = newCheckBox(this, "No blink", par.skip_blink, 
            "<p>Disable blinking of files.</p>" );
      this.blink_checkbox.onClick = function(checked) { 
            par.skip_blink.val = checked;
            if (par.skip_blink.val) {
                  if (blink_window != null) {
                        blink_window.forceClose();
                        blink_window = null;
                  }
            }
      }
      this.StartWithEmptyWindowPrefixBox = newCheckBox(this, "Start with empty window prefix", par.start_with_empty_window_prefix, 
            "<p>Start the script with empty window prefix</p>" );
      this.ManualIconColumnBox = newCheckBox(this, "Manual icon column control", par.use_manual_icon_column, 
            "<p>Enable manual control of icon columns. Useful for example when using multiple Workspaces.</p>" +
            "<p>This setting is effective only after restart of the script.</p>" );

      // Image parameters set 1.
      this.imageParamsSet1 = new VerticalSizer;
      this.imageParamsSet1.margin = 6;
      this.imageParamsSet1.spacing = 4;
      this.imageParamsSet1.add( this.FixColumnDefectsCheckBox );
      this.imageParamsSet1.add( this.FixRowDefectsCheckBox );
      this.imageParamsSet1.add( this.CosmeticCorrectionCheckBox );
      this.imageParamsSet1.add( this.SubframeSelectorCheckBox );
      this.imageParamsSet1.add( this.relaxedStartAlignCheckBox);
      this.imageParamsSet1.add( this.imageintegration_ssweight_CheckBox );
      this.imageParamsSet1.add( this.imageintegration_clipping_CheckBox );
      this.imageParamsSet1.add( this.no_mask_contrast_CheckBox );
      this.imageParamsSet1.add( this.remove_stars_early_CheckBox );
      
      // Image parameters set 2.
      this.imageParamsSet2 = new VerticalSizer;
      this.imageParamsSet2.margin = 6;
      this.imageParamsSet2.spacing = 4;
      this.imageParamsSet2.add( this.no_sharpening_CheckBox );
      this.imageParamsSet2.add( this.skip_noise_reduction_CheckBox );
      this.imageParamsSet2.add( this.use_background_neutralization_CheckBox );
      this.imageParamsSet2.add( this.useLocalNormalizationCheckBox );
      this.imageParamsSet2.add( this.skip_color_calibration_CheckBox );
      this.imageParamsSet2.add( this.color_calibration_before_ABE_CheckBox );
      this.imageParamsSet2.add( this.ABE_on_lights_CheckBox );
      this.imageParamsSet2.add( this.ABE_before_channel_combination_CheckBox );
      this.imageParamsSet2.add( this.useABE_L_RGB_CheckBox );
      this.imageParamsSet2.add( this.use_drizzle_CheckBox );

      // Image group par.
      this.imageParamsControl = new Control( this );
      this.imageParamsControl.sizer = new HorizontalSizer;
      this.imageParamsControl.sizer.margin = 6;
      this.imageParamsControl.sizer.spacing = 4;
      this.imageParamsControl.sizer.add( this.imageParamsSet1 );
      this.imageParamsControl.sizer.add( this.imageParamsSet2 );
      //this.imageParamsControl.sizer.addStretch();

      this.imageParamsGroupBox = newSectionBar(this, this.imageParamsControl, "Image processing parameters");

      // LRGBCombination selection
      this.LRGBCombinationLightnessControl = newNumericControl(this, "Lightness", par.LRGBCombination_lightness, 0, 1, 
            "<p>LRGBCombination lightness setting. Smaller value gives more bright image. Usually should be left to the default value.</p>");

      this.LRGBCombinationSaturationControl = newNumericControl(this, "Saturation", par.LRGBCombination_saturation, 0, 1, 
            "<p>LRGBCombination saturation setting. Smaller value gives more saturated image. Usually should be left to the default value.</p>");

      this.LRGBCombinationGroupBoxLabel = newSectionLabel(this, "LRGBCombination settings");
      this.LRGBCombinationGroupBoxLabel.toolTip = 
            "LRGBCombination settings can be used to fine tune image. For relatively small " +
            "and bright objects like galaxies it may be useful to reduce brightness and increase saturation.";
      this.LRGBCombinationGroupBoxSizer = new VerticalSizer;
      this.LRGBCombinationGroupBoxSizer.margin = 6;
      this.LRGBCombinationGroupBoxSizer.spacing = 4;
      this.LRGBCombinationGroupBoxSizer.add( this.LRGBCombinationLightnessControl );
      this.LRGBCombinationGroupBoxSizer.add( this.LRGBCombinationSaturationControl );

      // Saturation selection
      this.linearSaturationLabel = new Label( this );
      this.linearSaturationLabel.text = "Linear saturation increase";
      this.linearSaturationLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.linearSaturationLabel.toolTip = "<p>Saturation increase in linear state using a mask.</p>";
      this.linearSaturationSpinBox = newSpinBox(this, par.linear_increase_saturation, 0, 5, this.linearSaturationLabel.toolTip);

      this.nonLinearSaturationLabel = new Label( this );
      this.nonLinearSaturationLabel.text = "Non-linear saturation increase";
      this.nonLinearSaturationLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.nonLinearSaturationLabel.toolTip = "<p>Saturation increase in non-linear state using a mask.</p>";
      this.nonLinearSaturationSpinBox = newSpinBox(this, par.non_linear_increase_saturation, 0, 5, this.nonLinearSaturationLabel.toolTip);

      this.saturationGroupBoxLabel = newSectionLabel(this, "Saturation setting");
      this.saturationGroupBoxSizer = new HorizontalSizer;
      this.saturationGroupBoxSizer.margin = 6;
      this.saturationGroupBoxSizer.spacing = 4;
      this.saturationGroupBoxSizer.add( this.linearSaturationLabel );
      this.saturationGroupBoxSizer.add( this.linearSaturationSpinBox );
      this.saturationGroupBoxSizer.add( this.nonLinearSaturationLabel );
      this.saturationGroupBoxSizer.add( this.nonLinearSaturationSpinBox );
      this.saturationGroupBoxSizer.addStretch();

      // Noise reduction
      var noiseReductionToolTipCommon = "<p>Noise reduction is done using a luminance mask to target noise reduction on darker areas of the image. " +
                                        "Bigger strength value means stronger noise reduction.</p>" + 
                                        "<p>Noise reduction uses MultiscaleLinerTransform. Strength between 3 and 5 is the number of layers used to reduce noise. " + 
                                        "Strength 2 is very mild three layer noise reduction and strength 6 is very aggressive five layer noise reduction</p>";
      this.noiseReductionStrengthLabel = new Label( this );
      this.noiseReductionStrengthLabel.text = "Noise reduction";
      this.noiseReductionStrengthLabel.toolTip = "<p>Noise reduction strength for color channel (R,G,B,H,S,O) or color images.</p>" + noiseReductionToolTipCommon;
      this.noiseReductionStrengthLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   
      this.noiseReductionStrengthComboBox = newComboBoxStrvals(this, par.noise_reduction_strength, noise_reduction_strength_values, this.noiseReductionStrengthLabel.toolTip);

      this.luminanceNoiseReductionStrengthLabel = new Label( this );
      this.luminanceNoiseReductionStrengthLabel.text = "Luminance noise reduction";
      this.luminanceNoiseReductionStrengthLabel.toolTip = "<p>Noise reduction strength for luminance image.</p>" + noiseReductionToolTipCommon;
      this.luminanceNoiseReductionStrengthLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   
      this.luminanceNoiseReductionStrengthComboBox = newComboBoxStrvals(this, par.luminance_noise_reduction_strength, noise_reduction_strength_values, this.luminanceNoiseReductionStrengthLabel.toolTip);

      this.combined_noise_reduction_CheckBox = newCheckBox(this, "Combined image noise reduction", par.combined_image_noise_reduction,
            "<p>Do noise reduction on combined image instead of each color channels separately.</p>" );
      this.color_noise_reduction_CheckBox = newCheckBox(this, "Color noise reduction", par.use_color_noise_reduction, 
            "<p>Do color noise reduction.</p>" );

      this.ACDNR_noise_reduction_Control = newNumericControl(this, "ACDNR noise reduction", par.ACDNR_noise_reduction, 0, 5, 
            "<p>If non-zero, sets StdDev value and runs ACDNR noise reduction.</p>" +
            "<p>A mild ACDNR noise reduction with value between 1.0 and 2.0 can be useful to smooth image and reduce black spots left from previous noise reduction.</p>");

      this.noiseReductionGroupBoxLabel = newSectionLabel(this, "Noise reduction settings");
      this.noiseReductionGroupBoxSizer1 = new HorizontalSizer;
      this.noiseReductionGroupBoxSizer1.margin = 6;
      this.noiseReductionGroupBoxSizer1.spacing = 4;
      this.noiseReductionGroupBoxSizer1.add( this.noiseReductionStrengthLabel );
      this.noiseReductionGroupBoxSizer1.add( this.noiseReductionStrengthComboBox );
      this.noiseReductionGroupBoxSizer1.add( this.luminanceNoiseReductionStrengthLabel );
      this.noiseReductionGroupBoxSizer1.add( this.luminanceNoiseReductionStrengthComboBox );
      this.noiseReductionGroupBoxSizer1.add( this.ACDNR_noise_reduction_Control );
      this.noiseReductionGroupBoxSizer1.addStretch();

      this.noiseReductionGroupBoxSizer2 = new HorizontalSizer;
      this.noiseReductionGroupBoxSizer2.margin = 6;
      this.noiseReductionGroupBoxSizer2.spacing = 4;
      this.noiseReductionGroupBoxSizer2.add( this.color_noise_reduction_CheckBox );
      this.noiseReductionGroupBoxSizer2.add( this.combined_noise_reduction_CheckBox );
      this.noiseReductionGroupBoxSizer2.addStretch();

      this.noiseReductionGroupBoxSizer = new VerticalSizer;
      this.noiseReductionGroupBoxSizer.margin = 6;
      this.noiseReductionGroupBoxSizer.spacing = 4;
      this.noiseReductionGroupBoxSizer.add( this.noiseReductionGroupBoxSizer1 );
      this.noiseReductionGroupBoxSizer.add( this.noiseReductionGroupBoxSizer2 );
      //this.noiseReductionGroupBoxSizer.addStretch();

      this.binningLabel = new Label( this );
      this.binningLabel.text = "Binning 2x2";
      this.binningLabel.toolTip = 
            "<p>Do 2x2 binning for each light file. Binning is done first on calibrated files before any other operations.<p>" +
            "<p>With Color option binning is done only for color channel files.<p>" +
            "<p>With L and Color option binning is done for both luminance color channel files.<p>" +
            "<p>Binning uses IntegerResample process and should help to reduce noise at the cost of decreased resolution.<p>";
      this.binningLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   
      // Binning
      this.binningComboBox = newComboBox(this, par.binning, binning_values, this.binningLabel.toolTip);

      this.binningGroupBoxLabel = newSectionLabel(this, "Binning");
      this.binningGroupBoxSizer = new HorizontalSizer;
      this.binningGroupBoxSizer.margin = 6;
      this.binningGroupBoxSizer.spacing = 4;
      this.binningGroupBoxSizer.add( this.binningLabel );
      this.binningGroupBoxSizer.add( this.binningComboBox );
      this.binningGroupBoxSizer.addStretch();

      // Other parameters set 1.
      this.otherParamsSet1 = new VerticalSizer;
      this.otherParamsSet1.margin = 6;
      this.otherParamsSet1.spacing = 4;
      this.otherParamsSet1.add( this.CalibrateOnlyCheckBox );
      this.otherParamsSet1.add( this.IntegrateOnlyCheckBox );
      this.otherParamsSet1.add( this.ChannelCombinationOnlyCheckBox );
      this.otherParamsSet1.add( this.imageWeightTestingCheckBox );
      this.otherParamsSet1.add( this.start_from_imageintegration_CheckBox );
      this.otherParamsSet1.add( this.RRGB_image_CheckBox );
      this.otherParamsSet1.add( this.synthetic_l_image_CheckBox );
      this.otherParamsSet1.add( this.synthetic_missing_images_CheckBox );
      this.otherParamsSet1.add( this.no_subdirs_CheckBox );
      this.otherParamsSet1.add( this.select_all_files_CheckBox );
      this.otherParamsSet1.add( this.save_all_files_CheckBox );
      this.otherParamsSet1.add( this.use_starxterminator_CheckBox );

      // Other parameters set 2.
      this.otherParamsSet2 = new VerticalSizer;
      this.otherParamsSet2.margin = 6;
      this.otherParamsSet2.spacing = 4;
      this.otherParamsSet2.add( this.keepIntegratedImagesCheckBox );
      this.otherParamsSet2.add( this.keepTemporaryImagesCheckBox );
      this.otherParamsSet2.add( this.monochrome_image_CheckBox );
      this.otherParamsSet2.add( this.unique_file_names_CheckBox );
      this.otherParamsSet2.add( this.win_prefix_to_log_files_CheckBox );
      this.otherParamsSet2.add( this.batch_mode_CheckBox );
      this.otherParamsSet2.add( this.force_file_name_filter_CheckBox );
      this.otherParamsSet2.add( this.autodetect_filter_CheckBox );
      this.otherParamsSet2.add( this.autodetect_imagetyp_CheckBox );
      this.otherParamsSet2.add( this.generate_xdrz_CheckBox );
      this.otherParamsSet2.add( this.blink_checkbox );
      this.otherParamsSet2.add( this.StartWithEmptyWindowPrefixBox );
      this.otherParamsSet2.add( this.ManualIconColumnBox );

      // Other Group par.
      this.otherParamsControl = new Control( this );
      this.otherParamsControl.sizer = new HorizontalSizer;
      this.otherParamsControl.sizer.margin = 6;
      this.otherParamsControl.sizer.spacing = 4;
      this.otherParamsControl.sizer.add( this.otherParamsSet1 );
      this.otherParamsControl.sizer.add( this.otherParamsSet2 );
      //this.otherParamsControl.sizer.addStretch();
      
      this.otherParamsGroupBox = newSectionBar(this, this.otherParamsControl, "Other parameters");

      // Weight calculations
      var weightHelpToolTips =
            "<p>" +
            "Generic - Use both noise and stars for the weight calculation.<br>" +
            "Noise - More weight on image noise.<br>" +
            "Stars - More weight on stars.<br>" +
            "PSF Signal - Use PSF Signal value as is." +
            "PSF Signal scaled - PSF Signal value scaled to 1-100." +
            "FWHM scaled - FWHM value scaled to 1-100." +
            "Eccentricity scaled - Eccentricity value scaled to 1-100." +
            "SNR scaled - SNR value scaled to 1-100." +
            "Star count - Star count value." +
            "</p>" +
            "<p>" +
            "All values are scaled so that bigger value is better." +
            "</p>";

      this.weightLabel = new Label( this );
      this.weightLabel.text = "Weight calculation";
      this.weightLabel.toolTip = weightHelpToolTips;
      this.weightLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.weightComboBox = newComboBox(this, par.use_weight, use_weight_values, weightHelpToolTips);

      var weightLimitToolTip = "Limit value for SSWEIGHT. If value for SSWEIGHT is below the limit " +
                               "it is not included in the set of processed images.";
      this.weightLimitSpinBoxLabel = newLabel(this, "Limit", weightLimitToolTip);
      this.weightLimitSpinBox = newSpinBox(this, par.ssweight_limit, 0, 999999, weightLimitToolTip);

      this.outlierMethodLabel = new Label( this );
      this.outlierMethodLabel.text = "Outlier method";
      this.outlierMethodLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.outlierMethodLabel.toolTip = 
            "<p>Different methods are available for detecting outliers.<p>" +
            "<p>Two sigma filters out outliers that are two sigmas away from mean value.</p>" +
            "<p>One sigma filters out outliers that are one sigmas away from mean value. This option filters "+ 
            "more outliers than the two other options.</p>" +
            "<p>Interquartile range (IQR) measurement is based on median calculations. It should be " + 
            "relatively close to two sigma method.</p>";
      this.outlierMethodComboBox = newComboBox(this, par.outliers_method, outliers_methods, this.outlierMethodLabel.toolTip);

      this.outlierMinMax_CheckBox = newCheckBox(this, "Min Max", par.outliers_minmax, 
            "<p>If checked outliers are filtered using both min and max outlier threshold values.</p>" + 
            "<p>By default FWHM and Eccentricity are filtered for too high values, and SNR and SSWEIGHT are filtered for too low values.</p>" );

      var outlier_filtering_tooltip = 
            "<p>Skipping outliers can be useful when processing very large data sets and manual " +
            "filtering gets too complicated</p>" +
            "<p>Option 'SSWEIGHT' will filter out outliers based on the calculated SSWEIGHT value. It is an alternative " + 
            "to using a fixed Limit value.</p>" + 
            "<p>All other options will filter out outliers based on individual values.</p>";
      this.outlierLabel = new Label( this );
      this.outlierLabel.text = "Outlier filtering";
      this.outlierLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.outlierLabel.toolTip = outlier_filtering_tooltip;
      this.outlier_ssweight_CheckBox = newCheckBox(this, "SSWEIGHT", par.outliers_ssweight, outlier_filtering_tooltip);
      this.outlier_fwhm_CheckBox = newCheckBox(this, "FWHM", par.outliers_fwhm, outlier_filtering_tooltip);
      this.outlier_ecc_CheckBox = newCheckBox(this, "Ecc", par.outliers_ecc, outlier_filtering_tooltip);
      this.outlier_snr_CheckBox = newCheckBox(this, "SNR", par.outliers_snr, outlier_filtering_tooltip);
      this.outlier_psfsignal_CheckBox = newCheckBox(this, "PSF Signal", par.outliers_psfsignal, outlier_filtering_tooltip);
      this.outlier_psfpower_CheckBox = newCheckBox(this, "PSF Power", par.outliers_psfpower, outlier_filtering_tooltip);
      this.outlier_stars_CheckBox = newCheckBox(this, "Stars", par.outliers_stars, outlier_filtering_tooltip);

      this.weightGroupBoxLabel = newSectionLabel(this, "Image weight calculation settings");

      this.weightGroupBoxSizer = new HorizontalSizer;
      this.weightGroupBoxSizer.margin = 6;
      this.weightGroupBoxSizer.spacing = 4;
      this.weightGroupBoxSizer.add( this.weightLabel );
      this.weightGroupBoxSizer.add( this.weightComboBox );
      this.weightGroupBoxSizer.add( this.weightLimitSpinBoxLabel );
      this.weightGroupBoxSizer.add( this.weightLimitSpinBox );
      this.weightGroupBoxSizer.addStretch();

      this.weightGroupBoxSizer2 = new HorizontalSizer;
      this.weightGroupBoxSizer2.margin = 6;
      this.weightGroupBoxSizer2.spacing = 4;
      this.weightGroupBoxSizer2.add( this.outlierLabel );
      this.weightGroupBoxSizer2.add( this.outlier_ssweight_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_fwhm_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_ecc_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_snr_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_psfsignal_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_psfpower_CheckBox );
      this.weightGroupBoxSizer2.add( this.outlier_stars_CheckBox );
      this.weightGroupBoxSizer2.addStretch();

      this.weightGroupBoxSizer3 = new HorizontalSizer;
      this.weightGroupBoxSizer3.margin = 6;
      this.weightGroupBoxSizer3.spacing = 4;
      this.weightGroupBoxSizer3.add( this.outlierMethodLabel );
      this.weightGroupBoxSizer3.add( this.outlierMethodComboBox );
      this.weightGroupBoxSizer3.add( this.outlierMinMax_CheckBox );
      this.weightGroupBoxSizer3.addStretch();

      this.weightSizer = new VerticalSizer;
      //this.weightSizer.margin = 6;
      //this.weightSizer.spacing = 4;
      this.weightSizer.add( this.weightGroupBoxLabel );
      this.weightSizer.add( this.weightGroupBoxSizer );
      this.weightSizer.add( this.weightGroupBoxSizer2 );
      this.weightSizer.add( this.weightGroupBoxSizer3 );

      // CosmeticCorrection Sigma values
      //
      this.cosmeticCorrectionSigmaGroupBoxLabel = newSectionLabel(this, "CosmeticCorrection Sigma values");
      
      var cosmeticCorrectionSigmaGroupBoxLabeltoolTip = "Hot Sigma and Cold Sigma values for CosmeticCorrection";

      this.cosmeticCorrectionHotSigmaGroupBoxLabel = newLabel(this, "Hot Sigma", cosmeticCorrectionSigmaGroupBoxLabeltoolTip);
      this.cosmeticCorrectionHotSigmaSpinBox = newSpinBox(this, par.cosmetic_correction_hot_sigma, 0, 10, cosmeticCorrectionSigmaGroupBoxLabeltoolTip);
      this.cosmeticCorrectionColSigmaGroupBoxLabel = newLabel(this, "Cold Sigma", cosmeticCorrectionSigmaGroupBoxLabeltoolTip);
      this.cosmeticCorrectionColdSigmaSpinBox = newSpinBox(this, par.cosmetic_correction_cold_sigma, 0, 10, cosmeticCorrectionSigmaGroupBoxLabeltoolTip);
      this.cosmeticCorrectionSigmaGroupBoxSizer = new HorizontalSizer;
      this.cosmeticCorrectionSigmaGroupBoxSizer.margin = 6;
      this.cosmeticCorrectionSigmaGroupBoxSizer.spacing = 4;
      this.cosmeticCorrectionSigmaGroupBoxSizer.add( this.cosmeticCorrectionHotSigmaGroupBoxLabel );
      this.cosmeticCorrectionSigmaGroupBoxSizer.add( this.cosmeticCorrectionHotSigmaSpinBox );
      this.cosmeticCorrectionSigmaGroupBoxSizer.add( this.cosmeticCorrectionColSigmaGroupBoxLabel );
      this.cosmeticCorrectionSigmaGroupBoxSizer.add( this.cosmeticCorrectionColdSigmaSpinBox );
      this.cosmeticCorrectionSigmaGroupBoxSizer.toolTip = cosmeticCorrectionSigmaGroupBoxLabeltoolTip;
      this.cosmeticCorrectionSigmaGroupBoxSizer.addStretch();

      this.cosmeticCorrectionGroupBoxSizer = new VerticalSizer;
      //this.cosmeticCorrectionGroupBoxSizer.margin = 6;
      //this.cosmeticCorrectionGroupBoxSizer.spacing = 4;
      this.cosmeticCorrectionGroupBoxSizer.add( this.cosmeticCorrectionSigmaGroupBoxLabel );
      this.cosmeticCorrectionGroupBoxSizer.add( this.cosmeticCorrectionSigmaGroupBoxSizer );
      this.cosmeticCorrectionGroupBoxSizer.toolTip = cosmeticCorrectionSigmaGroupBoxLabeltoolTip;
      this.cosmeticCorrectionGroupBoxSizer.addStretch();

      // Linear Fit selection

      this.linearFitComboBox = newComboBox(this, par.use_linear_fit, use_linear_fit_values, "Choose how to do linear fit of images.");

      this.linearFitGroupBoxLabel = newSectionLabel(this, "Linear fit setting");
      this.linearFitGroupBoxSizer = new HorizontalSizer;
      this.linearFitGroupBoxSizer.margin = 6;
      this.linearFitGroupBoxSizer.spacing = 4;
      this.linearFitGroupBoxSizer.add( this.linearFitComboBox );
      this.linearFitGroupBoxSizer.addStretch();

      //
      // Stretching
      //

      this.stretchingComboBox = newComboBox(this, par.image_stretching, image_stretching_values, 
            "Auto STF - Use auto Screen Transfer Function to stretch image to non-linear.\n" +
            "Masked Stretch - Use MaskedStretch to stretch image to non-linear.\n" +
            "Use both - Use auto Screen Transfer Function for luminance and MaskedStretch for RGB to stretch image to non-linear. This is experimental test.\n" +
            "Hyperbolic - Experimental, , Generalized Hyperbolic stretching using PixelMath formulas from PixInsight forum member dapayne.");

      this.stretchingChoiceSizer = new HorizontalSizer;
      this.stretchingChoiceSizer.margin = 6;
      this.stretchingChoiceSizer.spacing = 4;
      this.stretchingChoiceSizer.add( this.stretchingComboBox );
      this.stretchingChoiceSizer.addStretch();

      this.STFLabel = new Label( this );
      this.STFLabel.text = "Auto STF link RGB channels";
      this.STFLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.STFLabel.toolTip = 
      "<p>" +
      "RGB channel linking in Screen Transfer Function." +
      "</p><p>" +
      "With Auto the default for true RGB images is to use linked channels. For narrowband and OSC/DSLR images the default " +
      "is to use unlinked channels. But if linear fit is done with narrowband images, then linked channels are used." +
      "</p>";
      this.STFComboBox = newComboBox(this, par.STF_linking, STF_linking_values, this.STFLabel.toolTip);

      this.STFSizer = new HorizontalSizer;
      this.STFSizer.spacing = 4;
      this.STFSizer.toolTip = this.STFLabel.toolTip;
      this.STFSizer.add( this.STFLabel );
      this.STFSizer.add( this.STFComboBox );

      this.STFTargetBackgroundControl = newNumericControl(this, "STF targetBackground", par.STF_targetBackground, 0, 1,
            "<p>STF targetBackground value. If you get too bright image lowering this value can help.</p>");
      this.STFTargetBackgroundControl.setPrecision(3);

      this.MaskedStretchTargetBackgroundControl = newNumericControl(this, "Masked Stretch targetBackground", par.MaskedStretch_targetBackground, 0, 1,
            "<p>Masked Stretch targetBackground value. Usually values between 0.1 and 0.2 work best.</p>");
      this.MaskedStretchTargetBackgroundControl.setPrecision(3);

      this.Hyperbolic_D_Control = newNumericControl(this, "Hyperbolic Stretch D value", par.Hyperbolic_D, 0, 20,
            "<p>Experimental, Hyperbolic Stretch D value with 0 meaning no stretch/change at all and 10 being the maximum for most cases.</p>");
      this.Hyperbolic_b_Control = newNumericControl(this, "Hyperbolic Stretch b value", par.Hyperbolic_b, 0, 10,
            "<p>Experimental, Hyperbolic Stretch b value that can be thought of as the stretch intensity. For bigger b, the stretch will be greater " + 
            "focused around a single intensity, while a lower b will spread the stretch around. Mathematically, a b=0 represents a pure " +
            "exponential stretch, while 0<b<1 represents a hyperbolic stretch, b=1 is a harmonic stretch, and b>1 is a highly intense, " + 
            "super-hyperbolic stretch. Often it is best to keep b<2.</p>");

      this.hyperbolicIterationsLabel = newSectionLabel(this, "Hyperbolic stretch iterations");
      this.hyperbolicIterationsLabel.toolTip = "Experimental, Number of iterations for Hyperbolic Stretch.";
      this.hyperbolicIterationsSpinBox = newSpinBox(this, par.Hyperbolic_iterations, 1, 10, this.hyperbolicIterationsLabel.toolTip);
      this.hyperbolicIterationsSizer = new HorizontalSizer;
      this.hyperbolicIterationsSizer.spacing = 4;
      this.hyperbolicIterationsSizer.margin = 2;
      this.hyperbolicIterationsSizer.add( this.hyperbolicIterationsLabel );
      this.hyperbolicIterationsSizer.add( this.hyperbolicIterationsSpinBox );

      this.StretchingOptionsSizer = new VerticalSizer;
      this.StretchingOptionsSizer.spacing = 4;
      this.StretchingOptionsSizer.margin = 2;
      this.StretchingOptionsSizer.add( this.STFSizer );
      this.StretchingOptionsSizer.add( this.STFTargetBackgroundControl );
      this.StretchingOptionsSizer.add( this.MaskedStretchTargetBackgroundControl );
      //this.StretchingOptionsSizer.addStretch();

      this.StretchingGroupBoxLabel = newSectionLabel(this, "Image stretching settings");
      this.StretchingGroupBoxLabel.toolTip = "Settings for stretching linear image image to non-linear.";
      this.StretchingGroupBoxSizer = new VerticalSizer;
      this.StretchingGroupBoxSizer.margin = 6;
      this.StretchingGroupBoxSizer.spacing = 4;
      this.StretchingGroupBoxSizer.add( this.stretchingChoiceSizer );
      this.StretchingGroupBoxSizer.add( this.StretchingOptionsSizer );
      this.StretchingOptionsSizer.add( this.Hyperbolic_D_Control );
      this.StretchingOptionsSizer.add( this.Hyperbolic_b_Control );
      this.StretchingOptionsSizer.add( this.hyperbolicIterationsSizer );
      //this.StretchingGroupBoxSizer.addStretch();

      //
      // Image integration
      //
      var ImageIntegrationHelpToolTips = 
            "<p>" +
            "Auto1 - Default set 1 uses percentile clipping for less than 8 images " +
            "and sigma clipping otherwise." +
            "</p><p>" +
            "Auto2 - Default set 2 uses percentile clipping for 1-7 images, " +
            "averaged sigma clipping for 8 - 10 images, " +
            "winsorised sigma clipping for 11 - 19 images, " +
            "linear fit clipping for 20 - 24 images, " +
            "ESD clipping for more than 25 images" +
            "</p><p>" +
            "Percentile - Percentile clip" +
            "</p><p>" +
            "Sigma - Sigma clipping" +
            "</p><p>" +
            "Winsorised - Winsorised sigma clipping" +
            "</p><p>" +
            "Averaged - Averaged sigma clipping" +
            "</p><p>" +
            "Linear - Linear fit clipping" +
            "</p><p>" +
            "EDS - Extreme Studentized Deviate clipping" +
            "</p>";

      // normalization
      this.ImageIntegrationNormalizationLabel = new Label( this );
      this.ImageIntegrationNormalizationLabel.text = "Normalization";
      this.ImageIntegrationNormalizationLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   
      this.ImageIntegrationNormalizationComboBox = newComboBox(this, par.imageintegration_normalization, imageintegration_normalization_values, '');
   
      this.ImageIntegrationNormalizationSizer = new HorizontalSizer;
      this.ImageIntegrationNormalizationSizer.spacing = 4;
      this.ImageIntegrationNormalizationSizer.add( this.ImageIntegrationNormalizationLabel );
      this.ImageIntegrationNormalizationSizer.add( this.ImageIntegrationNormalizationComboBox, 100 );

      // Pixel rejection algorithm/clipping
      this.ImageIntegrationRejectionLabel = new Label( this );
      this.ImageIntegrationRejectionLabel.text = "Rejection";
      this.ImageIntegrationRejectionLabel.toolTip = ImageIntegrationHelpToolTips;
      this.ImageIntegrationRejectionLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   
      this.ImageIntegrationRejectionComboBox = newComboBox(this, par.use_clipping, use_clipping_values, ImageIntegrationHelpToolTips);
   
      // Image integration
      this.ImageIntegrationRejectionSizer = new HorizontalSizer;
      this.ImageIntegrationRejectionSizer.spacing = 4;
      this.ImageIntegrationRejectionSizer.add( this.ImageIntegrationRejectionLabel );
      this.ImageIntegrationRejectionSizer.add( this.ImageIntegrationRejectionComboBox, 100 );

      this.clippingGroupBoxLabel = newSectionLabel(this, 'Image integration pixel rejection');
      this.clippingGroupBoxSizer = new HorizontalSizer;
      this.clippingGroupBoxSizer.margin = 6;
      this.clippingGroupBoxSizer.spacing = 4;
      this.clippingGroupBoxSizer.add( this.ImageIntegrationNormalizationSizer );
      this.clippingGroupBoxSizer.add( this.ImageIntegrationRejectionSizer );
      this.clippingGroupBoxSizer.toolTip = ImageIntegrationHelpToolTips;
      //this.clippingGroupBoxSizer.addStretch();

      // Narrowband palette

      var narrowbandAllTip = 
            "Option All runs all narrowband palettes in a batch mode and creates images with names Auto_+palette-name. You can use " +
            "extra options, then also images with name Auto_+palette-name+_extra are created. Images are saved as .xisf files. " +
            "Use Save batch result files buttons to save them all in a different format. " + 
            "To use All option all HSO filters must be available.";

      var narrowbandToolTip = 
      "<p>" +
      "Color palette used to map SII, Ha and OIII to R, G and B" +
      "</p><p>" +
      "There is a list of predefined mapping that can be used, some examples are below." +
      "</p><p>" +
      "SHO - SII=R, Ha=G, OIII=B  (Hubble)<br>" +
      "HOS - Ha=R, OIII=G, SII=B (CFHT)<br>" +
      "HOO - Ha=R, OIII=G, OIII=B (if there is SII it is ignored)" +
      "</p><p>" +
      "Mapping formulas are editable and other palettes can use any combination of channel images." +
      "</p><p>" +
      "Special keywords H, S, O, R, G and B are recognized and replaced " +
      "with corresponding channel image names. Otherwise these formulas " +
      "are passed directly to PixelMath process." +
      "</p><p>" +
      narrowbandAllTip + 
      "</p>";

      this.narrowbandColorPaletteLabel = newSectionLabel(this, "Color palette");
      this.narrowbandColorPaletteLabel.toolTip = narrowbandToolTip;

      /* Narrowband to RGB mappings. 
       */
      this.narrowbandCustomPalette_ComboBox = new ComboBox( this );
      for (var i = 0; i < narrowBandPalettes.length; i++) {
            this.narrowbandCustomPalette_ComboBox.addItem( narrowBandPalettes[i].name );
      }
      this.narrowbandCustomPalette_ComboBox.toolTip = 
            "<p>" +
            "List of predefined color palettes. You can also edit mapping input boxes to create your own mapping." +
            "</p><p>" +
            "Dynamic palettes, credit https://thecoldestnights.com/2020/06/PixInsight-dynamic-narrowband-combinations-with-pixelmath/<br>" +
            "L-eXtreme SHO palette was posted by Alessio Pariani to Astrobin forums. It is an example mapping for L-eXtreme filter." +
            "</p>" +
            narrowbandToolTip;
      this.narrowbandCustomPalette_ComboBox.onItemSelected = function( itemIndex )
      {
            this.dialog.narrowbandCustomPalette_R_ComboBox.editText = narrowBandPalettes[itemIndex].R;
            this.dialog.narrowbandCustomPalette_G_ComboBox.editText = narrowBandPalettes[itemIndex].G;
            this.dialog.narrowbandCustomPalette_B_ComboBox.editText = narrowBandPalettes[itemIndex].B;

            par.custom_R_mapping.val = this.dialog.narrowbandCustomPalette_R_ComboBox.editText;
            par.custom_G_mapping.val = this.dialog.narrowbandCustomPalette_G_ComboBox.editText;
            par.custom_B_mapping.val = this.dialog.narrowbandCustomPalette_B_ComboBox.editText;
      };

      /* Create Editable boxes for R, G and B mapping. 
       */
      this.narrowbandCustomPalette_R_Label = new Label( this );
      this.narrowbandCustomPalette_R_Label.text = "R";
      this.narrowbandCustomPalette_R_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.narrowbandCustomPalette_R_Label.toolTip = 
            "<p>" +
            "Mapping for R channel. Use one of the predefined mappings or edit and create your own mapping." +
            "</p>" +
            narrowbandToolTip;

      this.narrowbandCustomPalette_R_ComboBox = newComboBoxpalette(this, par.custom_R_mapping, [par.custom_R_mapping.val, "0.75*H + 0.25*S"], this.narrowbandCustomPalette_R_Label.toolTip);

      this.narrowbandCustomPalette_G_Label = new Label( this );
      this.narrowbandCustomPalette_G_Label.text = "G";
      this.narrowbandCustomPalette_G_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.narrowbandCustomPalette_G_Label.toolTip = 
            "<p>" +
            "Mapping for G channel. Use one of the predefined mappings or edit and create your own mapping." +
            "</p>" +
            narrowbandToolTip;

      this.narrowbandCustomPalette_G_ComboBox = newComboBoxpalette(this, par.custom_G_mapping, [par.custom_G_mapping.val, "0.50*S + 0.50*O"], this.narrowbandCustomPalette_G_Label.toolTip);

      this.narrowbandCustomPalette_B_Label = new Label( this );
      this.narrowbandCustomPalette_B_Label.text = "B";
      this.narrowbandCustomPalette_B_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.narrowbandCustomPalette_B_Label.toolTip = 
            "<p>" +
            "Mapping for B channel. Use one of the predefined mappings or edit and create your own mapping." +
            "</p>" +
            narrowbandToolTip;

      this.narrowbandCustomPalette_B_ComboBox = newComboBoxpalette(this, par.custom_B_mapping, [par.custom_B_mapping.val, "0.30*H + 0.70*O"], this.narrowbandCustomPalette_B_Label.toolTip);

      this.narrowbandCustomPalette_Sizer = new HorizontalSizer;
      this.narrowbandCustomPalette_Sizer.margin = 6;
      this.narrowbandCustomPalette_Sizer.spacing = 4;
      this.narrowbandCustomPalette_Sizer.toolTip = narrowbandToolTip;
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_ComboBox );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_R_Label );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_R_ComboBox );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_G_Label );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_G_ComboBox );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_B_Label );
      this.narrowbandCustomPalette_Sizer.add( this.narrowbandCustomPalette_B_ComboBox );

      this.mapping_on_nonlinear_data_CheckBox = newCheckBox(this, "Narrowband mapping using non-linear data", par.mapping_on_nonlinear_data, 
            "<p>" +
            "Do narrowband mapping using non-linear data. Before running PixelMath images are stretched to non-linear state. " +
            "</p>" );

      this.narrowbandLinearFit_Label = new Label( this );
      this.narrowbandLinearFit_Label.text = "Linear fit";
      this.narrowbandLinearFit_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.narrowbandLinearFit_Label.toolTip = 
            "<p>" +
            "Linear fit setting before running PixelMath." +
            "</p><p>" +
            "None does not use linear fit.<br>" +
            "Auto uses linear fit and tries to choose a less bright channel, first O and then S.<br>" +
            "Other selections use linear fit with that channel image." +
            "</p>";
      this.narrowbandLinearFit_Label.margin = 6;
      this.narrowbandLinearFit_Label.spacing = 4;
      this.narrowbandLinearFit_ComboBox = newComboBox(this, par.narrowband_linear_fit, narrowband_linear_fit_values, this.narrowbandLinearFit_Label.toolTip);

      this.mapping_on_nonlinear_data_Sizer = new HorizontalSizer;
      this.mapping_on_nonlinear_data_Sizer.margin = 2;
      this.mapping_on_nonlinear_data_Sizer.spacing = 4;
      this.mapping_on_nonlinear_data_Sizer.add( this.mapping_on_nonlinear_data_CheckBox );
      this.mapping_on_nonlinear_data_Sizer.add( this.narrowbandLinearFit_Label );
      this.mapping_on_nonlinear_data_Sizer.add( this.narrowbandLinearFit_ComboBox );

      /* Luminance channel mapping.
       */
      this.narrowbandLuminancePalette_ComboBox = new ComboBox( this );
      this.narrowbandLuminancePalette_ComboBox.addItem( "L" );
      this.narrowbandLuminancePalette_ComboBox.addItem( "max(L, H)" );
      this.narrowbandLuminancePalette_ComboBox.toolTip = "Mapping of Luminance channel with narrowband data, if both are available.";
      this.narrowbandLuminancePalette_ComboBox.onItemSelected = function( itemIndex )
      {
            switch (itemIndex) {
                  case 0:
                        this.dialog.narrowbandCustomPalette_L_ComboBox.editText = "L";
                        break;
                  case 1:
                        this.dialog.narrowbandCustomPalette_L_ComboBox.editText = "max(L, H)";
                        break;
            }
            par.custom_L_mapping.val = this.dialog.narrowbandCustomPalette_L_ComboBox.editText;
      };

      this.narrowbandCustomPalette_L_Label = new Label( this );
      this.narrowbandCustomPalette_L_Label.text = "L";
      this.narrowbandCustomPalette_L_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      this.narrowbandCustomPalette_L_Label.toolTip = this.narrowbandLuminancePalette_ComboBox.toolTip;

      this.narrowbandCustomPalette_L_ComboBox = newComboBoxpalette(this, par.custom_L_mapping, [par.custom_L_mapping.val, "max(L, H)"], this.narrowbandLuminancePalette_ComboBox.toolTip);

      this.NbLuminanceLabel = new Label( this );
      this.NbLuminanceLabel.text = "Luminance mapping";
      this.NbLuminanceLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.NbLuminanceLabel.toolTip = this.narrowbandLuminancePalette_ComboBox.toolTip;
      this.NbLuminanceSizer = new HorizontalSizer;
      this.NbLuminanceSizer.margin = 2;
      this.NbLuminanceSizer.spacing = 4;
      this.NbLuminanceSizer.add( this.NbLuminanceLabel );
      this.NbLuminanceSizer.add( this.narrowbandLuminancePalette_ComboBox );
      this.NbLuminanceSizer.add( this.narrowbandCustomPalette_L_Label );
      this.NbLuminanceSizer.add( this.narrowbandCustomPalette_L_ComboBox );
      this.NbLuminanceSizer.addStretch();

      /* RGBNB mapping.
       */
      var RGBNB_tooltip = 
            "<p>" +
            "A special processing is used for narrowband to (L)RGB image " +
            "mapping. It is used to enhance (L)RGB channels with narrowband data. " + 
            "</p><p>" +
            "This mapping cannot be used without RGB filters. " + 
            "</p><p>" +
            "This mapping is similar to NBRGBCombination script in PixInsight or " +
            "as described in Light Vortex Astronomy tutorial Combining LRGB with Narrowband. " +
            "You can find more details on parameters from those sources. " +
            "</p><p>" +
            "If narrowband RGB mapping is used then narrowband Color palette is not used." +
            "</p><p>" +
            "With narrowband RGB mapping you can choose:<br>" +
            "- Which narrowband channels mapped (L)RGB channels to enhance those.<br>" +
            "- Boost for (L)RGB channels.<br>" +
            "- Bandwidth for each filter.<br>" +
            "- Test the mapping with a test button" +
            "</p><p>" +
            "If there is no Luminance channel available then selections for L channel are ignored." +
            "</p>";
            
      this.useRGBNBmapping_CheckBox = newCheckBox(this, "Use Narrowband RGB mapping", par.use_RGBNB_Mapping, RGBNB_tooltip);
      this.useRGBbandwidth_CheckBox = newCheckBox(this, "Use RGB image", par.use_RGB_image, 
            "<p>" +
            "Use RGB image for bandwidth mapping instead of separate R, G and B channel images. " +
            "R channel bandwidth is then used for the RGB image." +
            "</p>" );
      this.useRGBNBmappingSizer = new HorizontalSizer;
      this.useRGBNBmappingSizer.margin = 6;
      this.useRGBNBmappingSizer.spacing = 4;
      this.useRGBNBmappingSizer.add( this.useRGBNBmapping_CheckBox );
      this.useRGBNBmappingSizer.add( this.useRGBbandwidth_CheckBox );

      // Button to test narrowband mapping
      this.testNarrowbandMappingButton = new PushButton( this );
      this.testNarrowbandMappingButton.text = "Test";
      this.testNarrowbandMappingButton.toolTip = 
            "<p>" +
            "Test narrowband RGB mapping. This requires that you have opened:" +
            "</p><p>" +
            "- Integration_RGB file.<br>" +
            "- Those narrowband files Integration_[SHO] that are used in the mapping." +
            "</p><p>" +
            "To get required Integration_RGB and Integration_[SHO] files you can a full workflow first." +
            "</p><p>" +
            "Result image will be in linear mode." +
            "</p>" ;
      this.testNarrowbandMappingButton.onClick = function()
      {
            console.writeln("Test narrowband mapping");
            par.use_RGBNB_Mapping.val = true;
            clearDefaultDirs();
            try {
                  testRGBNBmapping();
                  setDefaultDirs();
            } 
            catch(err) {
                  console.criticalln(err);
                  console.criticalln("Processing stopped!");
                  writeProcessingSteps(null, true, ppar.win_prefix + "AutoRGBNB");
                  console.endLog();
                  setDefaultDirs();
            }
            par.use_RGBNB_Mapping.val = false;
      };   

      // channel mapping
      this.RGBNB_MappingLabel = newLabel(this, 'Mapping', "Select mapping of narrowband channels to (L)RGB channels.");
      this.RGBNB_MappingLLabel = newLabel(this, 'L', "Mapping of narrowband channel to L channel. If there is no L channel available then this setting is ignored.");
      this.RGBNB_MappingLValue = newComboBox(this, par.L_mapping, RGBNB_mapping_values, this.RGBNB_MappingLLabel.toolTip);
      this.RGBNB_MappingRLabel = newLabel(this, 'R', "Mapping of narrowband channel to R channel. If no mapping is selected then channel is left unchanged.");
      this.RGBNB_MappingRValue = newComboBox(this, par.R_mapping, RGBNB_mapping_values, this.RGBNB_MappingRLabel.toolTip);
      this.RGBNB_MappingGLabel = newLabel(this, 'G', "Mapping of narrowband channel to G channel. If no mapping is selected then channel is left unchanged.");
      this.RGBNB_MappingGValue = newComboBox(this, par.G_mapping, RGBNB_mapping_values, this.RGBNB_MappingGLabel.toolTip);
      this.RGBNB_MappingBLabel = newLabel(this, 'B', "Mapping of narrowband channel to G channel. If no mapping is selected then channel is left unchanged.");
      this.RGBNB_MappingBValue = newComboBox(this, par.B_mapping, RGBNB_mapping_values, this.RGBNB_MappingBLabel.toolTip);

      this.RGBNB_MappingSizer = new HorizontalSizer;
      this.RGBNB_MappingSizer.margin = 6;
      this.RGBNB_MappingSizer.spacing = 4;
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingLabel );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingLLabel );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingLValue );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingRLabel );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingRValue );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingGLabel );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingGValue );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingBLabel );
      this.RGBNB_MappingSizer.add( this.RGBNB_MappingBValue );
      this.RGBNB_MappingSizer.addStretch();

      // Boost factor for LRGB
      this.RGBNB_BoostLabel = newLabel(this, 'Boost', "Select boost, or multiplication factor, for the channels.");
      this.RGBNB_BoostLValue = newNumericEdit(this, 'L', par.L_BoostFactor, "Boost, or multiplication factor, for the L channel.");
      this.RGBNB_BoostRValue = newNumericEdit(this, 'R', par.R_BoostFactor, "Boost, or multiplication factor, for the R channel.");
      this.RGBNB_BoostGValue = newNumericEdit(this, 'G', par.G_BoostFactor, "Boost, or multiplication factor, for the G channel.");
      this.RGBNB_BoostBValue = newNumericEdit(this, 'B', par.B_BoostFactor, "Boost, or multiplication factor, for the B channel.");

      this.RGBNB_BoostSizer = new HorizontalSizer;
      this.RGBNB_BoostSizer.margin = 6;
      this.RGBNB_BoostSizer.spacing = 4;
      this.RGBNB_BoostSizer.add( this.RGBNB_BoostLabel );
      this.RGBNB_BoostSizer.add( this.RGBNB_BoostLValue );
      this.RGBNB_BoostSizer.add( this.RGBNB_BoostRValue );
      this.RGBNB_BoostSizer.add( this.RGBNB_BoostGValue );
      this.RGBNB_BoostSizer.add( this.RGBNB_BoostBValue );
      this.RGBNB_BoostSizer.addStretch();

      this.RGBNB_Sizer1 = new HorizontalSizer;
      this.RGBNB_Sizer1.add(this.RGBNB_MappingSizer);
      this.RGBNB_Sizer1.add(this.RGBNB_BoostSizer);
      this.RGBNB_Sizer1.addStretch();

      // Bandwidth for different channels
      this.RGBNB_BandwidthLabel = newLabel(this, 'Bandwidth', "Select bandwidth (nm) for each filter.");
      this.RGBNB_BandwidthLValue = newNumericEdit(this, 'L', par.L_bandwidth, "Bandwidth (nm) for the L filter.");
      this.RGBNB_BandwidthRValue = newNumericEdit(this, 'R', par.R_bandwidth, "Bandwidth (nm) for the R filter.");
      this.RGBNB_BandwidthGValue = newNumericEdit(this, 'G', par.G_bandwidth, "Bandwidth (nm) for the G filter.");
      this.RGBNB_BandwidthBValue = newNumericEdit(this, 'B', par.B_bandwidth, "Bandwidth (nm) for the B filter.");
      this.RGBNB_BandwidthHValue = newNumericEdit(this, 'H', par.H_bandwidth, "Bandwidth (nm) for the H filter. Typical values could be 7 nm or 3 nm.");
      this.RGBNB_BandwidthSValue = newNumericEdit(this, 'S', par.S_bandwidth, "Bandwidth (nm) for the S filter. Typical values could be 8.5 nm or 3 nm.");
      this.RGBNB_BandwidthOValue = newNumericEdit(this, 'O', par.O_bandwidth, "Bandwidth (nm) for the O filter. Typical values could be 8.5 nm or 3 nm.");

      this.RGBNB_BandwidthSizer = new HorizontalSizer;
      this.RGBNB_BandwidthSizer.margin = 6;
      this.RGBNB_BandwidthSizer.spacing = 4;
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthLabel );
      //this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthRGBValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthLValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthRValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthGValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthBValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthHValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthSValue );
      this.RGBNB_BandwidthSizer.add( this.RGBNB_BandwidthOValue );
      this.RGBNB_BandwidthSizer.add( this.testNarrowbandMappingButton );
      this.RGBNB_BandwidthSizer.addStretch();

      this.RGBNB_Sizer = new VerticalSizer;
      this.RGBNB_Sizer.margin = 6;
      //this.RGBNB_Sizer.spacing = 4;
      this.RGBNB_Sizer.toolTip = RGBNB_tooltip;
      this.RGBNB_Sizer.add(this.useRGBNBmappingSizer);
      this.RGBNB_Sizer.add(this.RGBNB_Sizer1);
      this.RGBNB_Sizer.add(this.RGBNB_BandwidthSizer);
      this.RGBNB_Sizer.addStretch();

      this.narrowbandControl = new Control( this );
      // this.narrowbandControl.title = "Narrowband processing";
      this.narrowbandControl.sizer = new VerticalSizer;
      this.narrowbandControl.sizer.margin = 6;
      this.narrowbandControl.sizer.spacing = 4;
      this.narrowbandControl.sizer.add( this.narrowbandColorPaletteLabel );
      this.narrowbandControl.sizer.add( this.narrowbandCustomPalette_Sizer );
      this.narrowbandControl.sizer.add( this.mapping_on_nonlinear_data_Sizer );
      this.narrowbandControl.sizer.add( this.NbLuminanceSizer );
      //this.narrowbandControl.sizer.add( this.narrowbandAutoContinue_sizer );

      this.narrowbandGroupBox = newSectionBar(this, this.narrowbandControl, "Narrowband processing");

      this.narrowbandRGBmappingControl = new Control( this );
      //this.narrowbandRGBmappingControl.title = "Narrowband to RGB mapping";
      this.narrowbandRGBmappingControl.sizer = new VerticalSizer;
      this.narrowbandRGBmappingControl.sizer.margin = 6;
      this.narrowbandRGBmappingControl.sizer.spacing = 4;
      this.narrowbandRGBmappingControl.sizer.add( this.RGBNB_Sizer );
      //this.narrowbandRGBmappingControl.sizer.add( this.narrowbandAutoContinue_sizer );
      // hide this section by default
      this.narrowbandRGBmappingControl.visible = false;

      this.narrowbandRGBmappingGroupBox = newSectionBar(this, this.narrowbandRGBmappingControl, "Narrowband to RGB mapping");

      // Narrowband extra processing
      this.fix_narrowband_star_color_CheckBox = newCheckBox(this, "Fix star colors", par.fix_narrowband_star_color, 
            "<p>Fix magenta color on stars typically seen with SHO color palette. If all green is not removed from the image then a mask use used to fix only stars. " + 
            "This is also run with AutoContinue and Extra processing.</p>" );
      this.narrowband_hue_shift_CheckBox = newCheckBox(this, "Hue shift for more orange", par.run_hue_shift, 
            "<p>Do hue shift to enhance orange color. Useful with SHO color palette. Also run with AutoContinue and Extra processing.</p>" );
      this.narrowband_leave_some_green_CheckBox = newCheckBox(this, "Leave some green", par.leave_some_green, 
            "<p>Leave some green color on image when running SCNR (amount 0.50). Useful with SHO color palette. " +
            "This is also run with AutoContinue and Extra processing.</p>" );
      this.run_narrowband_SCNR_CheckBox = newCheckBox(this, "Remove green cast", par.run_narrowband_SCNR, 
            "<p>Run SCNR to remove green cast. Useful with SHO color palette. This is also run with AutoContinue and Extra processing.</p>" );
      this.no_star_fix_mask_CheckBox = newCheckBox(this, "No mask when fixing star colors", par.skip_star_fix_mask, 
            "<p>Do not use star mask when fixing star colors</p>" );

      this.narrowbandOptions1_sizer = new VerticalSizer;
      this.narrowbandOptions1_sizer.margin = 6;
      this.narrowbandOptions1_sizer.spacing = 4;
      this.narrowbandOptions1_sizer.add( this.narrowband_hue_shift_CheckBox );
      this.narrowbandOptions1_sizer.add( this.run_narrowband_SCNR_CheckBox );
      this.narrowbandOptions1_sizer.add( this.narrowband_leave_some_green_CheckBox );

      this.narrowbandOptions2_sizer = new VerticalSizer;
      this.narrowbandOptions2_sizer.margin = 6;
      this.narrowbandOptions2_sizer.spacing = 4;
      this.narrowbandOptions2_sizer.add( this.fix_narrowband_star_color_CheckBox );
      this.narrowbandOptions2_sizer.add( this.no_star_fix_mask_CheckBox );

      this.narrowbandExtraLabel = newSectionLabel(this, "Extra processing for narrowband");
      this.narrowbandExtraLabel.toolTip = 
            "<p>" +
            "Extra processing options to be applied on narrowband images. "+
            "They are applied before other extra processing options in the following order:" +
            "</p><p>" +
            "1. Hue shift for more orange<br>" +
            "2. Remove green cast and Leave some green<br>" +
            "3. Fix star colors" +
            "</p>";
      this.narrowbandExtraOptionsSizer = new HorizontalSizer;
      //this.narrowbandExtraOptionsSizer.margin = 6;
      //this.narrowbandExtraOptionsSizer.spacing = 4;
      this.narrowbandExtraOptionsSizer.add( this.narrowbandOptions1_sizer );
      this.narrowbandExtraOptionsSizer.add( this.narrowbandOptions2_sizer );
      this.narrowbandExtraOptionsSizer.toolTip = this.narrowbandExtraLabel.toolTip;
      this.narrowbandExtraOptionsSizer.addStretch();

      // Extra processing
      this.extraRemoveStars_CheckBox = newCheckBox(this, "Remove stars", par.extra_remove_stars, 
            "<p>Run Starnet or StarXTerminator on image to generate a starless image and a separate image for the stars. When this is selected, extra processing is " +
            "applied to the starless image. Smaller stars option is run on star images. At the end of the processing also a combined image is created " + 
            "from starless and star images.</p>" );
      this.extraDarkerBackground_CheckBox = newCheckBox(this, "Darker background", par.extra_darker_background, 
            "<p>Make image background darker.</p>" );
      this.extraABE_CheckBox = newCheckBox(this, "ABE", par.extra_ABE, 
            "<p>Run AutomaticBackgroundExtractor.</p>" );
      this.extra_HDRMLT_CheckBox = newCheckBox(this, "HDRMultiscaleTransform", par.extra_HDRMLT, 
            "<p>Run HDRMultiscaleTransform on image.</p>" );
      this.extra_LHE_CheckBox = newCheckBox(this, "LocalHistogramEqualization", par.extra_LHE, 
            "<p>Run LocalHistogramEqualization on image.</p>" );
      this.extra_Contrast_CheckBox = newCheckBox(this, "Add contrast", par.extra_contrast, 
            "<p>Run slight S shape curves transformation on image to add contrast.</p>" );
      this.contrastIterationsSpinBox = newSpinBox(this, par.extra_contrast_iterations, 1, 5, "Number of iterations for contrast enhancement");
      this.contrastIterationsLabel = new Label( this );
      this.contrastIterationsLabel.text = "iterations";
      this.contrastIterationsLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.contrastIterationsLabel.toolTip = this.contrastIterationsSpinBox.toolTip;
      this.extraContrastSizer = new HorizontalSizer;
      this.extraContrastSizer.spacing = 4;
      this.extraContrastSizer.add( this.extra_Contrast_CheckBox );
      this.extraContrastSizer.add( this.contrastIterationsSpinBox );
      this.extraContrastSizer.add( this.contrastIterationsLabel );
      this.extraContrastSizer.toolTip = this.contrastIterationsSpinBox.toolTip;
      this.extraContrastSizer.addStretch();

      this.extra_stretch_CheckBox = newCheckBox(this, "Auto stretch", par.extra_stretch, 
            "<p>Run automatic stretch on image. Can be helpful in some rare cases but most useful on testing stretching settings.</p>" );

      this.extra_SmallerStars_CheckBox = newCheckBox(this, "Smaller stars", par.extra_smaller_stars, 
            "<p>Make stars smaller on image.</p>" );
      this.smallerStarsIterationsSpinBox = newSpinBox(this, par.extra_smaller_stars_iterations, 0, 10, 
            "Number of iterations when reducing star sizes. Value zero uses Erosion instead of Morphological Selection");
      this.smallerStarsIterationsLabel = new Label( this );
      this.smallerStarsIterationsLabel.text = "iterations";
      this.smallerStarsIterationsLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.smallerStarsIterationsLabel.toolTip = this.smallerStarsIterationsSpinBox.toolTip;
      this.extraSmallerStarsSizer = new HorizontalSizer;
      this.extraSmallerStarsSizer.spacing = 4;
      this.extraSmallerStarsSizer.add( this.extra_SmallerStars_CheckBox );
      this.extraSmallerStarsSizer.add( this.smallerStarsIterationsSpinBox );
      this.extraSmallerStarsSizer.add( this.smallerStarsIterationsLabel );
      this.extraSmallerStarsSizer.toolTip = this.smallerStarsIterationsSpinBox.toolTip;
      this.extraSmallerStarsSizer.addStretch();

      var extra_noise_reduction_tooltip = "<p>Noise reduction on image.</p>" + noiseReductionToolTipCommon;
      this.extra_NoiseReduction_CheckBox = newCheckBox(this, "Noise reduction", par.extra_noise_reduction, 
            extra_noise_reduction_tooltip);

      this.extraNoiseReductionStrengthComboBox = newComboBoxStrvals(this, par.extra_noise_reduction_strength, noise_reduction_strength_values, extra_noise_reduction_tooltip);
      this.extraNoiseReductionStrengthLabel = new Label( this );
      this.extraNoiseReductionStrengthLabel.text = "strength";
      this.extraNoiseReductionStrengthLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.extraNoiseReductionStrengthLabel.toolTip = extra_noise_reduction_tooltip;
      this.extraNoiseReductionStrengthSizer = new HorizontalSizer;
      this.extraNoiseReductionStrengthSizer.spacing = 4;
      this.extraNoiseReductionStrengthSizer.add( this.extra_NoiseReduction_CheckBox );
      this.extraNoiseReductionStrengthSizer.add( this.extraNoiseReductionStrengthComboBox );
      this.extraNoiseReductionStrengthSizer.add( this.extraNoiseReductionStrengthLabel );
      this.extraNoiseReductionStrengthSizer.toolTip = extra_noise_reduction_tooltip;
      this.extraNoiseReductionStrengthSizer.addStretch();

      this.extraImageLabel = new Label( this );
      this.extraImageLabel.text = "Target image";
      this.extraImageLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
      this.extraImageLabel.toolTip = "<p>Target image for extra processing. Target image is replaced with processed image. This can be useful " + 
      "if extra processing is not done with Run or AutoContinue option.</p>";
      this.extraImageComboBox = new ComboBox( this );
      var windowList = getWindowListReverse();
      windowList.unshift("Auto");
      for (var i = 0; i < windowList.length; i++) {
            this.extraImageComboBox.addItem( windowList[i] );
      }
      extra_target_image = windowList[0];
      this.extraImageComboBox.onItemSelected = function( itemIndex )
      {
            extra_target_image = windowList[itemIndex];
      };
      this.extraApplyButton = new PushButton( this );
      this.extraApplyButton.text = "Apply";
      this.extraApplyButton.toolTip = 
            "Apply extra processing on the selected image. Auto option is used when extra processing is done with Run or AutoContinue option.";
      this.extraApplyButton.onClick = function()
      {
            if (!is_extra_option() && !is_narrowband_option()) {
                  console.criticalln("No extra processing option selected!");
            } else if (extra_target_image == null) {
                  console.criticalln("No image!");
            } else if (extra_target_image == "Auto") {
                  console.criticalln("Auto target image cannot be used with Apply button!");
            } else {
                  console.writeln("Apply extra processing directly on " + extra_target_image);
                  try {
                        narrowband = is_narrowband_option();
                        extraProcessingEngine(extra_target_image);
                        narrowband = false;
                  } 
                  catch(err) {
                        console.criticalln(err);
                        console.criticalln("Processing stopped!");
                        narrowband = false;
                  }
            }
      };   

      this.extraImageSizer = new HorizontalSizer;
      this.extraImageSizer.spacing = 4;
      this.extraImageSizer.add( this.extraImageLabel );
      this.extraImageSizer.add( this.extraImageComboBox );
      this.extraImageSizer.add( this.extraApplyButton );
      this.extraImageSizer.addStretch();

      this.extra1 = new VerticalSizer;
      this.extra1.margin = 6;
      this.extra1.spacing = 4;
      this.extra1.add( this.extraRemoveStars_CheckBox );
      this.extra1.add( this.extraABE_CheckBox );
      this.extra1.add( this.extraDarkerBackground_CheckBox );
      this.extra1.add( this.extra_HDRMLT_CheckBox );
      this.extra1.add( this.extra_LHE_CheckBox );

      this.extra2 = new VerticalSizer;
      this.extra2.margin = 6;
      this.extra2.spacing = 4;
      this.extra2.add( this.extraContrastSizer );
      this.extra2.add( this.extra_stretch_CheckBox );
      this.extra2.add( this.extraNoiseReductionStrengthSizer );
      this.extra2.add( this.extraSmallerStarsSizer );

      this.extraLabel = newSectionLabel(this, "Generic extra processing");

      this.extraGroupBoxSizer = new HorizontalSizer;
      //this.extraGroupBoxSizer.margin = 6;
      //this.extraGroupBoxSizer.spacing = 4;
      this.extraGroupBoxSizer.add( this.extra1 );
      this.extraGroupBoxSizer.add( this.extra2 );
      this.extraGroupBoxSizer.addStretch();

      this.extraControl = new Control( this );
      // this.extraControl.title = "Extra processing";
      this.extraControl.sizer = new VerticalSizer;
      this.extraControl.sizer.margin = 6;
      this.extraControl.sizer.spacing = 4;
      this.extraControl.sizer.add( this.narrowbandExtraLabel );
      this.extraControl.sizer.add( this.narrowbandExtraOptionsSizer );
      this.extraControl.sizer.add( this.extraLabel );
      this.extraControl.sizer.add( this.extraGroupBoxSizer );
      this.extraControl.sizer.add( this.extraImageSizer );
      this.extraControl.sizer.addStretch();
      this.extraControl.toolTip = 
            "<p>" +
            "In case of Run or AutoContinue " + 
            "extra processing options are always applied to a copy of the final image. " + 
            "A new image is created with _extra added to the name. " + 
            "For example if the final image is AutoLRGB then a new image AutoLRGB_extra is created. " + 
            "AutoContinue can be used to apply extra processing after the final image is created. " +
            "</p><p>" +
            "In case of Apply button extra processing is run directly on the selected image. " +
            "</p><p>" +
            "Both extra processing options and narrowband processing options are applied to the image. If some of the " +
            "narrowband options are selected then image is assumed to be narrowband." +
            "</p><p>" +
            "If multiple extra processing options are selected they are executed in the following order" +
            "</p><p>" +
            "1. Remove stars<br>" +
            "2. Darker background<br>" +
            "3. HDRMultiscaleTransform<br>" +
            "4. LocalHistogramEqualization<br>" +
            "5. Add contrast<br>" +
            "6. Auto STF<br>" +
            "7. Noise reduction<br>" +
            "8. Smaller stars" +
            "With Smaller stars the number of iterations can be given. More iterations will generate smaller stars." +
            "</p><p>" +
            "If narrowband processing options are selected they are applied before extra processing options." +
            "</p>";

      this.extraGroupBox = newSectionBar(this, this.extraControl, "Extra processing");

      // Button to continue LRGB from existing files
      this.autoContinueButton = new PushButton( this );
      this.autoContinueButton.text = "AutoContinue";
      this.autoContinueButton.toolTip = 
            "AutoContinue - Run automatic processing from previously created LRGB, HSO or Color images." +
            "<p>" +
            "Image check order is:<br>" +
            "1. L_HT + RGB_HT<br>" +
            "2. RGB_HT<br>" +
            "3. Integration_L_BE + Integration_RGB_BE<br>" +
            "4. Integration_RGB_BE<br>" +
            "5. Integration_L_BE + Integration_R_BE + Integration_G_BE + Integration_B_BE<br>" +
            "6. Integration_H_BE + Integration_S_BE + Integration_O_BE<br>" +
            "7. Integration_L + Integration_R + Integration_G + Integration_B<br>" +
            "8. Integration_H + Integration_S + Integration_O<br>" +
            "9. Final image (for extra processing)" +
            "</p>" +
            "<p>" +
            "Not all images must be present, for example L image can be missing.<br>" +
            "RGB = Combined image, can be RGB or HSO.<br>" +
            "HT = Histogram Transformation, image is manually stretched to non-liner state.<br>" +
            "BE = Background Extracted, for example manual DBE is run on image.<br>" +
            "</p>";
      this.autoContinueButton.onClick = function()
      {
            exitFromDialog();
            console.writeln("autoContinue");

            // Do not create subdirectory structure with AutoContinue

            clearDefaultDirs();
            getFilesFromTreebox(this.dialog);
            batch_narrowband_palette_mode = isbatchNarrowbandPaletteMode();
            haveIconized = 0;
            write_processing_log_file = true;
            try {
                  updateWindowPrefix();
                  autocontinue_narrowband = is_narrowband_option();
                  run_auto_continue = true;
                  if (batch_narrowband_palette_mode) {
                        AutoIntegrateNarrowbandPaletteBatch(true);
                  } else {
                        var index = findPrefixIndex(ppar.win_prefix);
                        if (index == -1) {
                              iconStartRow = 0;
                              index = findNewPrefixIndex(ppar.userColumnCount == -1);
                        } else {
                              // With AutoContinue start icons below current
                              // icons.
                              iconStartRow = ppar.prefixArray[index][2];
                        }
                        if (ppar.userColumnCount == -1) {
                              columnCount = ppar.prefixArray[index][0];
                              console.writeln('Using auto icon column ' + columnCount);
                        } else {
                              columnCount = ppar.userColumnCount;
                              iconStartRow = 11;
                              console.writeln('Using user icon column ' + columnCount);
                        }
                        AutoIntegrateEngine(true);
                  }
                  autocontinue_narrowband = false;
                  run_auto_continue = false;
                  setDefaultDirs();
                  if (haveIconized && !batch_narrowband_palette_mode) {
                        // We have iconized something so update prefix array
                        ppar.prefixArray[index] = [ columnCount, ppar.win_prefix, Math.max(haveIconized, iconStartRow) ];
                        fix_win_prefix_array();
                        //this.columnCountControlComboBox.currentItem = columnCount + 1;
                        savePersistentSettings();
                  }
            }
            catch(err) {
                  console.criticalln(err);
                  console.criticalln("Processing stopped!");
                  writeProcessingSteps(null, true, null);
                  autocontinue_narrowband = false;
                  run_auto_continue = false;
                  setDefaultDirs();
                  fix_win_prefix_array();
            }
      };   

      // Button to close all windows
      this.closeAllButton = new PushButton( this );
      this.closeAllButton.text = "Close all";
      this.closeAllButton.toolTip = "<p>Close all image windows created by this script</p>" +
                                    "<p>If Window Prefix is used then all windows with that prefix are closed. " +
                                    "To close all windows with all prefixes use button Close all prefixes</p>";
      this.closeAllButton.onClick = function()
      {
            console.writeln("closeAll");
            updateWindowPrefix();
            // Close all using the current ppar.win_prefix
            closeAllWindows(par.keep_integrated_images.val, false);
            var index = findPrefixIndex(ppar.win_prefix);
            if (index != -1) {
                  // If prefix was found update array
                  if (par.keep_integrated_images.val) {
                        // If we keep integrated images then we can start
                        // from zero icon position
                        ppar.prefixArray[index][2] = 0;
                  } else {
                        // Mark closed position as empty/free
                        ppar.prefixArray[index] = [ 0, '-', 0 ];
                        fix_win_prefix_array();
                  }
                  savePersistentSettings();
                  //this.columnCountControlComboBox.currentItem = columnCount + 1;
            }
      };

      closeAllPrefixButton = new PushButton( this );
      closeAllPrefixButton.text = "Close all prefixes";
      closeAllPrefixButton.toolTip = "Updated in function setWindowPrefixHelpTip";
      closeAllPrefixButton.onClick = function()
      {
            console.writeln("closeAllPrefix");
            try {
                  updateWindowPrefix();
                  // Always close default/empty prefix
                  // For delete to work we need to update fixed window
                  // names with the prefix we use for closing
                  fixAllWindowArrays("");
                  console.writeln("Close default empty prefix");
                  closeAllWindows(par.keep_integrated_images.val, false);
                  if (ppar.win_prefix != "" && findPrefixIndex(ppar.win_prefix) == -1) {
                        // Window prefix box has unsaved prefix, clear that too.
                        console.writeln("Close prefix '" + ppar.win_prefix + "'");
                        fixAllWindowArrays(ppar.win_prefix);
                        closeAllWindows(par.keep_integrated_images.val, false);
                  }
                  // Go through the prefix list
                  for (var i = 0; i < ppar.prefixArray.length; i++) {
                        if (ppar.prefixArray[i][1] != '-') {
                              console.writeln("Close prefix '" + ppar.prefixArray[i][1] + "'");
                              fixAllWindowArrays(ppar.prefixArray[i][1]);
                              closeAllWindows(par.keep_integrated_images.val, false);
                              if (par.keep_integrated_images.val) {
                                    // If we keep integrated images then we can start
                                    // from zero icon position
                                    ppar.prefixArray[i][2] = 0;
                              } else {
                                    // Mark closed position as empty/free
                                    ppar.prefixArray[i] = [ 0, '-', 0 ];
                              }
                        }
                  }
                  if (par.use_manual_icon_column.val && ppar.userColumnCount != -1) {
                        ppar.userColumnCount = 0;
                  }
            }  catch (x) {
                  console.writeln( x );
            }
            fix_win_prefix_array();
            savePersistentSettings();
            // restore original prefix
            fixAllWindowArrays(ppar.win_prefix);
      };

      if (par.use_manual_icon_column.val) {
            this.columnCountControlLabel = new Label( this );
            this.columnCountControlLabel.text = "Icon Column ";
            this.columnCountControlLabel.textAlignment = TextAlign_Left|TextAlign_VertCenter;
            this.columnCountControlLabel.toolTip = "<p>Set Icon Column for next run.</p> " + 
                                                "<p>This keeps window icons from piling up on top of one another, " +
                                                "as you change prefixes and run again.</p>" +
                                                "<p>Set to 1 if you have removed all the icons " + 
                                                "created by AutoIntegrate or changed to a fresh workspace.</p>" + 
                                                "<p>Set to a free column if you have deleted a column of icons by hand.</p>" + 
                                                "<p>Left alone the script will manage the value, incrementing after each run, " +
                                                "decrementing if you close all windows, " +
                                                "and saving the value between script invocations.</p>";
            this.columnCountControlComboBox = new ComboBox( this );
            addArrayToComboBox(this.columnCountControlComboBox, column_count_values);
            if (ppar.userColumnCount == -1) {
                  this.columnCountControlComboBox.currentItem = 0;
            } else {
                  this.columnCountControlComboBox.currentItem = ppar.userColumnCount + 1;
            }
            this.columnCountControlComboBox.toolTip = this.columnCountControlLabel.toolTip;
            this.columnCountControlComboBox.onItemSelected = function( itemIndex )
            {
                  if (itemIndex == 0) {
                        // Auto
                        ppar.userColumnCount = -1;
                  } else {
                        // Combo box values start with one but in the code
                        // we want values to start with zero.
                        ppar.userColumnCount = parseInt(column_count_values[itemIndex]) - 1;
                  }
            };
      }

      // Group box for AutoContinue and CloseAll
      this.autoButtonSizer = new HorizontalSizer;
      this.autoButtonSizer.add( this.autoContinueButton );
      this.autoButtonSizer.addSpacing( 4 );
      this.autoButtonSizer.add( this.closeAllButton );
      if (par.use_manual_icon_column.val) {
            this.autoButtonSizer.addSpacing ( 150 );
      } else {
            this.autoButtonSizer.addSpacing ( 250 );
      }
      this.autoButtonSizer.add( closeAllPrefixButton );
      if (par.use_manual_icon_column.val) {
            this.autoButtonSizer.addSpacing ( 4 );
            this.autoButtonSizer.add( this.columnCountControlLabel );
            this.autoButtonSizer.add( this.columnCountControlComboBox );
      }
      this.autoButtonGroupBox = new newGroupBox( this );
      this.autoButtonGroupBox.sizer = new HorizontalSizer;
      this.autoButtonGroupBox.sizer.margin = 6;
      this.autoButtonGroupBox.sizer.spacing = 4;
      this.autoButtonGroupBox.sizer.add( this.autoButtonSizer );
      this.autoButtonGroupBox.sizer.addStretch();
      //this.autoButtonGroupBox.setFixedHeight(60);

      // Buttons for saving final images in different formats
      this.mosaicSaveXisfButton = new PushButton( this );
      this.mosaicSaveXisfButton.text = "XISF";
      // this.mosaicSaveXisfButton.icon = this.scaledResource( ":/file-format/xisf-format-icon.png" );
      this.mosaicSaveXisfButton.onClick = function()
      {
            console.writeln("Save XISF");
            saveAllFinalImageWindows(32);
      };   
      this.mosaicSave16bitButton = new PushButton( this );
      this.mosaicSave16bitButton.text = "16 bit TIFF";
      // this.mosaicSave16bitButton.icon = this.scaledResource( ":/file-format/tiff-format-icon.png" );
      this.mosaicSave16bitButton.onClick = function()
      {
            console.writeln("Save 16 bit TIFF");
            saveAllFinalImageWindows(16);
      };   
      this.mosaicSave8bitButton = new PushButton( this );
      this.mosaicSave8bitButton.text = "8 bit TIFF";
      // this.mosaicSave8bitButton.icon = this.scaledResource( ":/file-format/tiff-format-icon.png" );
      this.mosaicSave8bitButton.onClick = function()
      {
            console.writeln("Save 8 bit TIFF");
            saveAllFinalImageWindows(8);
      };   
      this.mosaicSaveSizer = new HorizontalSizer;
      this.mosaicSaveSizer.add( this.mosaicSaveXisfButton );
      this.mosaicSaveSizer.addSpacing( 4 );
      this.mosaicSaveSizer.add( this.mosaicSave16bitButton );
      this.mosaicSaveSizer.addSpacing( 4 );
      this.mosaicSaveSizer.add( this.mosaicSave8bitButton );
      this.mosaicSaveGroupBox = new newGroupBox( this );
      this.mosaicSaveGroupBox.title = "Save final image files";
      this.mosaicSaveGroupBox.sizer = new HorizontalSizer;
      this.mosaicSaveGroupBox.sizer.margin = 6;
      this.mosaicSaveGroupBox.sizer.spacing = 4;
      this.mosaicSaveGroupBox.sizer.add( this.mosaicSaveSizer );
      this.mosaicSaveGroupBox.sizer.addStretch();

      var paramSaveResetSettingsToolTip = 
            "<p>Save all current parameter values using the PixInsight persistent module settings mechanism. Saved parameter " + 
            "values are remembered and automatically restored when the script starts.</p> " +
            "<p>Persistent module settings are overwritten by any settings restored from process icon.</p>" +
            "<p>Set default button sets default values for all parameters.</p>";
      this.paramSaveResetSettingsSaveButton = new PushButton( this );
      this.paramSaveResetSettingsSaveButton.text = "Save";
      this.paramSaveResetSettingsSaveButton.toolTip = paramSaveResetSettingsToolTip;
      this.paramSaveResetSettingsSaveButton.onClick = function()
      {
            saveParametersToPersistentModuleSettings();
      };   

      this.paramSaveResetSettingsClearButton = new PushButton( this );
      this.paramSaveResetSettingsClearButton.text = "Set defaults";
      this.paramSaveResetSettingsClearButton.toolTip = "Set default values for all parameters.";
      this.paramSaveResetSettingsClearButton.onClick = function()
      {
            setParameterDefaults();
      };   

      this.paramSaveResetGroupBox = new newGroupBox( this );
      this.paramSaveResetGroupBox.title = "Save and reset parameters";
      this.paramSaveResetGroupBox.toolTip = paramSaveResetSettingsToolTip;
      this.paramSaveResetGroupBox.sizer = new HorizontalSizer;
      this.paramSaveResetGroupBox.sizer.toolTip = paramSaveResetSettingsToolTip;
      this.paramSaveResetGroupBox.sizer.margin = 6;
      this.paramSaveResetGroupBox.sizer.spacing = 4;
      this.paramSaveResetGroupBox.sizer.add( this.paramSaveResetSettingsSaveButton );
      this.paramSaveResetGroupBox.sizer.add( this.paramSaveResetSettingsClearButton );
      this.paramSaveResetGroupBox.sizer.addStretch();

      this.filesaveAndParamSizer = new HorizontalSizer;
      this.filesaveAndParamSizer.margin = 6;
      this.filesaveAndParamSizer.spacing = 4;
      this.filesaveAndParamSizer.add( this.mosaicSaveGroupBox );
      this.filesaveAndParamSizer.add( this.paramSaveResetGroupBox );

      // Run and Exit buttons
      this.run_Button = new PushButton( this );
      this.run_Button.text = "Run";
      this.run_Button.icon = this.scaledResource( ":/icons/power.png" );
      this.run_Button.onClick = function()
      {
            exitFromDialog();
            updateWindowPrefix();
            getFilesFromTreebox(this.dialog);
            haveIconized = 0;
            var index = findPrefixIndex(ppar.win_prefix);
            if (index == -1) {
                  index = findNewPrefixIndex(ppar.userColumnCount == -1);
            }
            if (ppar.userColumnCount == -1) {
                  columnCount = ppar.prefixArray[index][0];
                  console.writeln('Using auto icon column ' + columnCount);
            } else {
                  columnCount = ppar.userColumnCount;
                  console.writeln('Using user icon column ' + columnCount);
            }
            iconStartRow = 0;
            write_processing_log_file = true;
            Autorun(this);
            if (haveIconized) {
                  // We have iconized something so update prefix array
                  ppar.prefixArray[index] = [ columnCount, ppar.win_prefix, haveIconized ];
                  fix_win_prefix_array();
                  if (ppar.userColumnCount != -1 && par.use_manual_icon_column.val) {
                        ppar.userColumnCount = columnCount + 1;
                        this.dialog.columnCountControlComboBox.currentItem = ppar.userColumnCount + 1;
                  }
                  savePersistentSettings();
            }
      };
   
      this.exit_Button = new PushButton( this );
      this.exit_Button.text = "Exit";
      this.exit_Button.icon = this.scaledResource( ":/icons/close.png" );
      this.exit_Button.onClick = function()
      {
         console.noteln("AutoIntegrate exiting");
         exitFromDialog();
         // save prefix setting at the end
         savePersistentSettings();
         this.dialog.cancel();
      };
   
      this.newInstance_Button = new ToolButton(this);
      this.newInstance_Button.icon = new Bitmap( ":/process-interface/new-instance.png" );
      this.newInstance_Button.toolTip = "New Instance";
      this.newInstance_Button.onMousePress = function()
      {
         this.hasFocus = true;
         saveParametersToProcessIcon();
         this.pushed = false;
         this.dialog.newInstance();
      };
   
      this.infoLabel = new Label( this );
      this.infoLabel.text = "";

      infoLabel = this.infoLabel;

      this.buttons_Sizer = new HorizontalSizer;
      this.buttons_Sizer.spacing = 6;
      this.buttons_Sizer.add( this.newInstance_Button );
      this.buttons_Sizer.add( this.infoLabel );
      this.buttons_Sizer.addStretch();
      this.buttons_Sizer.add( this.run_Button );
      this.buttons_Sizer.add( this.exit_Button );
      this.buttons_Sizer.add( this.helpTips );

      this.ProcessingControl1 = new Control( this );
      this.ProcessingControl1.sizer = new VerticalSizer;
      this.ProcessingControl1.sizer.margin = 6;
      this.ProcessingControl1.sizer.spacing = 4;
      this.ProcessingControl1.sizer.add( this.saturationGroupBoxLabel );
      this.ProcessingControl1.sizer.add( this.saturationGroupBoxSizer );
      this.ProcessingControl1.sizer.add( this.noiseReductionGroupBoxLabel );
      this.ProcessingControl1.sizer.add( this.noiseReductionGroupBoxSizer );
      this.ProcessingControl1.sizer.add( this.binningGroupBoxLabel );
      this.ProcessingControl1.sizer.add( this.binningGroupBoxSizer );
      // hide this section by default
      this.ProcessingControl1.visible = false;

      this.ProcessingControl2 = new Control( this );
      this.ProcessingControl2.sizer = new VerticalSizer;
      this.ProcessingControl2.sizer.margin = 6;
      this.ProcessingControl2.sizer.spacing = 4;
      this.ProcessingControl2.sizer.add( this.linearFitGroupBoxLabel );
      this.ProcessingControl2.sizer.add( this.linearFitGroupBoxSizer );
      this.ProcessingControl2.sizer.add( this.StretchingGroupBoxLabel );
      this.ProcessingControl2.sizer.add( this.StretchingGroupBoxSizer );
      // hide this section by default
      this.ProcessingControl2.visible = false;

      this.ProcessingControl3 = new Control( this );
      this.ProcessingControl3.sizer = new VerticalSizer;
      this.ProcessingControl3.sizer.margin = 6;
      this.ProcessingControl3.sizer.spacing = 4;
      this.ProcessingControl3.sizer.add( this.weightSizer );
      // hide this section by default
      this.ProcessingControl3.visible = false;

      this.ProcessingControl4 = new Control( this );
      this.ProcessingControl4.sizer = new VerticalSizer;
      this.ProcessingControl4.sizer.margin = 6;
      this.ProcessingControl4.sizer.spacing = 4;
      this.ProcessingControl4.sizer.add( this.cosmeticCorrectionGroupBoxSizer );
      this.ProcessingControl4.sizer.add( this.clippingGroupBoxLabel );
      this.ProcessingControl4.sizer.add( this.clippingGroupBoxSizer );
      this.ProcessingControl4.sizer.add( this.LRGBCombinationGroupBoxLabel );
      this.ProcessingControl4.sizer.add( this.LRGBCombinationGroupBoxSizer );
      // hide this section by default
      this.ProcessingControl4.visible = false;

      this.ProcessingGroupBox = newSectionBar(this, this.ProcessingControl1, "Processing settings, saturation, binning and noise");
      newSectionBarAdd(this, this.ProcessingGroupBox, this.ProcessingControl2, "Processing settings, linear fit and stretching");
      newSectionBarAdd(this, this.ProcessingGroupBox, this.ProcessingControl3, "Processing settings, weighting and filtering");
      newSectionBarAdd(this, this.ProcessingGroupBox, this.ProcessingControl4, "Processing settings, other");

      this.col1 = new VerticalSizer;
      this.col1.margin = 6;
      this.col1.spacing = 4;
      this.col1.add( this.imageParamsGroupBox );
      this.col1.add( this.otherParamsGroupBox );
      this.col1.add( this.ProcessingGroupBox );
      this.col1.addStretch();

      this.col2 = new VerticalSizer;
      this.col2.margin = 6;
      this.col2.spacing = 4;
      this.col2.add( this.narrowbandGroupBox );
      this.col2.add( this.narrowbandRGBmappingGroupBox );
      this.col2.add( this.extraGroupBox );
      this.col2.add( this.filesaveAndParamSizer );
      this.col2.add( this.autoButtonGroupBox );
      this.col2.addStretch();

      this.cols = new HorizontalSizer;
      this.cols.margin = 6;
      this.cols.spacing = 4;
      this.cols.add( this.col1 );
      this.cols.add( this.col2 );
      this.cols.addStretch();

      /* ------------------------------- */

      this.sizer = new VerticalSizer;
      this.sizer.add( this.tabBox, 300 );
      //this.sizer.add( this.buttonsSizer);
      this.sizer.add( this.filesButtonsSizer);
      this.sizer.margin = 6;
      this.sizer.spacing = 6;
      this.sizer.add( this.cols );
      this.sizer.add( this.buttons_Sizer );
      this.sizer.addStretch();

      // Version number
      this.windowTitle = autointegrate_version; 
      this.userResizable = true;
      this.adjustToContents();
      //this.files_GroupBox.setFixedHeight();

      setWindowPrefixHelpTip(ppar.win_prefix);

      console.show(false);
}

AutoIntegrateDialog.prototype = new Dialog;

function main()
{
      try {
            setDefaultDirs();

            // 1. Read saved parameters from persistent module settings
            console.noteln("Read persistent module settings");
            ReadParametersFromPersistentModuleSettings();

            // 2. Read parameters saved to process icon, these overwrite persistent module settings
            if (Parameters.isGlobalTarget || Parameters.isViewTarget) {
                  // read default parameters from saved settings/process icon
                  console.noteln("Read process icon settings");
                  readParametersFromProcessIcon();
            }
            
            // 3. Read persistent module settings that are temporary work values
            // Read prefix info. We use new setting names to avoid conflict with
            // older columnCount/winPrefix names
            console.noteln("Read window prefix settings");
            var tempSetting = Settings.read(SETTINGSKEY + "/prefixName", DataType_String);
            if (Settings.lastReadOK) {
                  console.writeln("AutoIntegrate: Restored prefixName '" + tempSetting + "' from settings.");
                  ppar.win_prefix = tempSetting;
            }
            if (par.start_with_empty_window_prefix.val) {
                  ppar.win_prefix = '';
            }
            var tempSetting  = Settings.read(SETTINGSKEY + "/prefixArray", DataType_String);
            if (Settings.lastReadOK) {
                  console.writeln("AutoIntegrate: Restored prefixArray '" + tempSetting + "' from settings.");
                  ppar.prefixArray = JSON.parse(tempSetting);
                  if (ppar.prefixArray.length > 0 && ppar.prefixArray[0].length == 2) {
                        // We have old format prefix array without column position
                        // Add column position as the first array element
                        console.writeln("AutoIntegrate:converting old format prefix array " + JSON.stringify(ppar.prefixArray));
                        for (var i = 0; i < ppar.prefixArray.length; i++) {
                              if (ppar.prefixArray[i] == null) {
                                    ppar.prefixArray[i] = [0, '-', 0];
                              } else if (ppar.prefixArray[i][0] == '-') {
                                    // add zero column position
                                    ppar.prefixArray[i].unshift(0);
                              } else {
                                    // Used slot, add i as column position
                                    ppar.prefixArray[i].unshift(i);
                              }
                        }
                  }
                  fix_win_prefix_array();
            }
            var tempSetting = Settings.read(SETTINGSKEY + "/columnCount", DataType_Int32);
            if (Settings.lastReadOK) {
                  console.writeln("AutoIntegrate: Restored columnCount '" + tempSetting + "' from settings.");
                  ppar.userColumnCount = tempSetting;
            }
            if (!par.use_manual_icon_column.val) {
                  ppar.userColumnCount = -1;
            }

            fixAllWindowArrays(ppar.win_prefix);

            pixinsight_version_str = CoreApplication.versionMajor + '.' + CoreApplication.versionMinor + '.' + 
                                     CoreApplication.versionRelease + '.' + CoreApplication.versionRevision;
            pixinsight_version_num = CoreApplication.versionMajor * 1e6 + 
                                     CoreApplication.versionMinor * 1e4 + 
                                     CoreApplication.versionRelease * 1e2 + 
                                     CoreApplication.versionRevision;
            console.noteln(autointegrate_version + ", PixInsight v" + pixinsight_version_str + " (" + pixinsight_version_num + ")");
      }
      catch (x) {
            console.writeln( x );
      }


      var dialog = new AutoIntegrateDialog();

      dialog.execute();
}

main();
