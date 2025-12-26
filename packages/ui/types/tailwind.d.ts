// TypeScript definitions for Unisane UI Tailwind classes
// Enables IntelliSense for Material 3 color tokens and typography

declare module "tailwindcss" {
  interface Config {
    theme?: {
      extend?: {
        colors?: {
          // Material 3 Color Roles
          primary?: string;
          "on-primary"?: string;
          "primary-container"?: string;
          "on-primary-container"?: string;

          secondary?: string;
          "on-secondary"?: string;
          "secondary-container"?: string;
          "on-secondary-container"?: string;

          tertiary?: string;
          "on-tertiary"?: string;
          "tertiary-container"?: string;
          "on-tertiary-container"?: string;

          error?: string;
          "on-error"?: string;
          "error-container"?: string;
          "on-error-container"?: string;

          success?: string;
          "on-success"?: string;
          "success-container"?: string;
          "on-success-container"?: string;

          warning?: string;
          "on-warning"?: string;
          "warning-container"?: string;
          "on-warning-container"?: string;

          info?: string;
          "on-info"?: string;
          "info-container"?: string;
          "on-info-container"?: string;

          // Surface tones
          surface?: string;
          "on-surface"?: string;
          "surface-variant"?: string;
          "on-surface-variant"?: string;
          "surface-container"?: string;
          "surface-container-low"?: string;
          "surface-container-high"?: string;
          "surface-container-highest"?: string;
          "surface-container-lowest"?: string;

          background?: string;
          "on-background"?: string;

          outline?: string;
          "outline-variant"?: string;

          // Inverse colors
          "inverse-surface"?: string;
          "inverse-on-surface"?: string;
          "inverse-primary"?: string;

          scrim?: string;
        };

        fontSize?: {
          // Display
          "display-large"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "display-medium"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "display-small"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];

          // Headline
          "headline-large"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "headline-medium"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "headline-small"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];

          // Title
          "title-large"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "title-medium"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "title-small"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];

          // Body
          "body-large"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "body-medium"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "body-small"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];

          // Label
          "label-large"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "label-medium"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
          "label-small"?: [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string }];
        };

        spacing?: {
          // Industrial units
          "0.5u"?: string;
          "1u"?: string;
          "1.5u"?: string;
          "2u"?: string;
          "2.5u"?: string;
          "3u"?: string;
          "3.5u"?: string;
          "4u"?: string;
          "4.5u"?: string;
          "5u"?: string;
          "5.5u"?: string;
          "6u"?: string;
          "6.5u"?: string;
          "7u"?: string;
          "7.5u"?: string;
          "8u"?: string;
          "8.5u"?: string;
          "9u"?: string;
          "9.5u"?: string;
          "10u"?: string;
          "10.5u"?: string;
          "11u"?: string;
          "11.5u"?: string;
          "12u"?: string;
          "12.5u"?: string;
          "13u"?: string;
          "13.5u"?: string;
          "14u"?: string;
          "14.5u"?: string;
          "15u"?: string;
          "15.5u"?: string;
          "16u"?: string;
          "20u"?: string;
          "24u"?: string;
          "28u"?: string;
          "38u"?: string;

          // Icon sizes
          "icon-xs"?: string;
          "icon-sm"?: string;
          "icon-md"?: string;
          "icon-lg"?: string;
          "icon-xl"?: string;
        };

        borderRadius?: {
          xs?: string;
          sm?: string;
          md?: string;
          lg?: string;
          xl?: string;
          "2xl"?: string;
          full?: string;
        };

        boxShadow?: {
          "0"?: string;
          "1"?: string;
          "2"?: string;
          "3"?: string;
          "4"?: string;
          "5"?: string;
        };

        transitionDuration?: {
          short?: string;
          snappy?: string;
          medium?: string;
          emphasized?: string;
          long?: string;
        };

        transitionTimingFunction?: {
          standard?: string;
          emphasized?: string;
          smooth?: string;
          in?: string;
          out?: string;
        };

        opacity?: {
          "38"?: string;
          hover?: string;
          focus?: string;
          pressed?: string;
          dragged?: string;
          muted?: string;
          subtle?: string;
        };

        zIndex?: {
          modal?: string;
          popover?: string;
          drawer?: string;
          header?: string;
          fab?: string;
        };
      };
    };
  }
}

// Augment the global CSS types for better autocomplete
declare global {
  namespace CSS {
    interface Properties {
      // Material 3 Color Variables
      "--color-primary"?: string;
      "--color-on-primary"?: string;
      "--color-primary-container"?: string;
      "--color-on-primary-container"?: string;

      "--color-secondary"?: string;
      "--color-on-secondary"?: string;
      "--color-secondary-container"?: string;
      "--color-on-secondary-container"?: string;

      "--color-tertiary"?: string;
      "--color-on-tertiary"?: string;
      "--color-tertiary-container"?: string;
      "--color-on-tertiary-container"?: string;

      // Scaling
      "--scale-space"?: string | number;
      "--scale-type"?: string | number;
      "--scale-radius"?: string | number;
      "--unit"?: string;

      // Custom properties
      [key: `--color-${string}`]: string | number;
      [key: `--type-${string}`]: string | number;
      [key: `--ref-${string}`]: string | number;
    }
  }
}

export {};
