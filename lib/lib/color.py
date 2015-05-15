def scale(hex_string, scale_factor):

    if scale_factor < 0 or len(hex_string) != 7:
        return hex_string

    rgb_hex = [hex_string[x:x+2] for x in [1, 3, 5]]
    new_rgb_int = [int(hex_value, 16) + scale_factor for hex_value in rgb_hex]
    new_rgb_int = [min([255, max([0, i])]) for i in new_rgb_int]

    return '#' + ''.join([hex(int(i))[2:] for i in new_rgb_int])
