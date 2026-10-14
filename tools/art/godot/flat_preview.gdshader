shader_type canvas_item;
uniform float strength : hint_range(0.0, 1.0) = 0.0;

// Interactive shading study, preserves source alpha and silhouette.
// Applies to the canvas preview (including furniture), not to Web assets.
void fragment() {
	vec4 src = texture(TEXTURE, UV) * COLOR;
	float value = dot(src.rgb, vec3(0.2126, 0.7152, 0.0722));
	float band = floor(value * 5.0 + 0.5) / 5.0;
	vec3 simplified = clamp(src.rgb * band / max(value, 0.04), vec3(0.0), vec3(1.0));
	COLOR = vec4(mix(src.rgb, simplified, strength), src.a);
}
